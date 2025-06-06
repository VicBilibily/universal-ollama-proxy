import { OpenAI } from 'openai';
import { ModelConfig } from '../types';
import { ToolFilterConfig } from '../types/toolFilter';
import { UnifiedAdapterConfig, UnifiedProvider } from '../types/unifiedAdapter';
import { logger, OllamaError } from '../utils';
import { chatLogger } from '../utils/chatLogger';
import { processMessages } from '../utils/messageProcessor';
import { RequestQueue } from '../utils/requestQueue';
import { ModelDiscoveryService } from './modelDiscovery';
import { ToolFilterService } from './toolFilter';

/**
 * 统一适配器服务类
 * 使用OpenAI SDK统一处理所有AI服务提供商的请求
 */
export class UnifiedAdapterService {
  private providers: Map<string, OpenAI> = new Map();
  private modelDiscovery: ModelDiscoveryService;
  private config: UnifiedAdapterConfig;
  private requestQueue: RequestQueue;
  private toolFilterService: ToolFilterService;

  constructor(
    modelDiscovery: ModelDiscoveryService,
    config: UnifiedAdapterConfig,
    toolFilterConfig?: ToolFilterConfig
  ) {
    this.modelDiscovery = modelDiscovery;
    this.config = config;
    this.requestQueue = new RequestQueue();

    // 初始化工具过滤服务
    const defaultToolFilterConfig: ToolFilterConfig = {
      enabled: true,
      globalIgnore: false,
      rules: [],
      defaultAction: 'allow',
      logLevel: 'warn',
      performance: {
        enableCache: true,
        cacheExpiration: 300,
        maxCacheEntries: 1000,
      },
    };
    this.toolFilterService = new ToolFilterService(toolFilterConfig || defaultToolFilterConfig);

    this.initializeProviders();
  }

  /**
   * 从模型名称中提取提供商信息
   */
  private extractProviderFromModel(modelName: string): string {
    if (modelName.includes(':')) {
      return modelName.split(':')[0];
    }
    return 'unknown';
  }

  /**
   * 初始化所有提供商的OpenAI客户端
   */
  private initializeProviders(): void {
    for (const provider of this.config.providers) {
      try {
        // 如果提供商的 enabled 字段明确设置为 false，则跳过初始化
        if (provider.enabled === false) {
          logger.info(`跳过初始化 ${provider.displayName} 提供商，因为它被禁用了`);
          continue;
        }

        const client = new OpenAI({
          baseURL: provider.baseURL,
          apiKey: provider.apiKey || 'dummy-key', // 对于无需认证的提供商，使用占位符
          defaultHeaders: this.getProviderHeaders(provider),
          timeout: 300000, // 5分钟超时
          // 注意：OpenAI SDK 内部会处理HTTP连接，我们通过全局axios配置来优化连接池
        });

        this.providers.set(provider.name, client);
        logger.debug(`初始化${provider.displayName}提供商成功`, {
          provider: provider.name,
          baseURL: provider.baseURL,
        });
      } catch (error) {
        logger.error(`初始化${provider.displayName}提供商失败`, {
          provider: provider.name,
          error,
        });
      }
    }
  }

  /**
   * 获取提供商特定的请求头
   */
  private getProviderHeaders(provider: UnifiedProvider): Record<string, string> {
    // 从配置中获取请求头，如果没有配置则使用默认值
    return (
      provider.headers || {
        'Content-Type': 'application/json',
      }
    );
  }

  /**
   * 聊天接口 - 使用OpenAI SDK原生类型
   */
  async chat(
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    return this.requestQueue.add(async () => {
      const requestId = chatLogger.generateRequestId();
      const startTime = Date.now();
      let modelConfig: ModelConfig | null = null;

      try {
        // 获取模型配置
        modelConfig = await this.modelDiscovery.getModelConfig(request.model);
        if (!modelConfig) {
          throw new OllamaError(`不支持的模型: ${request.model}`, 400);
        }

        // 获取对应的OpenAI客户端
        const client = this.getClientForModel(request.model, modelConfig);

        // 准备OpenAI请求参数
        const openaiRequest = await this.prepareOpenAIRequest(request, modelConfig);

        // 记录详细请求日志（如果启用）
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestStart(requestId, request, openaiRequest, modelConfig);
        }

        if (request.stream) {
          return this.handleStreamChatWithLogging(client, openaiRequest, modelConfig, requestId, startTime);
        } else {
          return this.handleNonStreamChatWithLogging(client, openaiRequest, modelConfig, requestId, startTime);
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // 记录错误到详细日志
        if (chatLogger.isEnabled() && modelConfig) {
          await chatLogger.logRequestComplete(requestId, null, responseTime, !!request.stream, undefined, error, null);
        }

        logger.error('统一聊天请求失败', { requestId, model: request.model, error });
        if (error instanceof OllamaError) {
          throw error;
        }
        throw new OllamaError(`聊天请求失败: ${error}`, 500);
      }
    });
  }

  /**
   * 处理流式聊天并记录详细日志
   */
  private async handleStreamChatWithLogging(
    client: OpenAI,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig,
    requestId: string,
    startTime: number
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const extractProviderFromModel = this.extractProviderFromModel.bind(this);

    return (async function* () {
      try {
        const stream = await client.chat.completions.create({
          ...request,
          stream: true,
        });

        let chunkCount = 0;
        const allChunks: any[] = []; // 收集所有原始响应块
        const responseTime = Date.now() - startTime;

        for await (const chunk of stream) {
          chunkCount++;
          allChunks.push(chunk); // 收集原始响应块

          // 记录流式响应块到详细日志
          if (chatLogger.isEnabled()) {
            await chatLogger.logStreamChunk(requestId, chunk);
          }

          yield chunk;
        }

        // 记录流式完成到详细日志，包含所有原始响应块
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestComplete(requestId, null, responseTime, true, chunkCount, undefined, allChunks);
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // 尝试提取错误响应的原始数据（不包含本地堆栈信息）
        let rawErrorResponse = null;
        if (error && typeof error === 'object') {
          // 检查是否是 OpenAI SDK 的错误，包含响应信息
          if ('response' in error && error.response) {
            const errorWithResponse = error as any;
            rawErrorResponse = {
              status: errorWithResponse.response?.status,
              statusText: errorWithResponse.response?.statusText,
              headers: errorWithResponse.response?.headers,
              data: errorWithResponse.response?.data || errorWithResponse.message,
              error: errorWithResponse.message,
              // 移除本地堆栈信息，只保留远程错误信息
            };
          } else if ('message' in error) {
            const errorWithMessage = error as any;
            // 创建一个过滤后的错误对象，排除本地堆栈信息
            const filteredError = { ...errorWithMessage };
            delete filteredError.stack; // 移除本地堆栈信息
            rawErrorResponse = {
              error: errorWithMessage.message,
              ...filteredError,
            };
          } else {
            rawErrorResponse = error;
          }
        }

        // 记录错误到详细日志，包含原始错误响应
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestComplete(requestId, null, responseTime, true, undefined, error, rawErrorResponse);
        }

        logger.error('流式聊天处理失败', {
          requestId,
          provider: extractProviderFromModel(request.model),
          model: modelConfig.name,
          error,
          rawErrorResponse,
        });
        throw new OllamaError(`流式聊天失败: ${error}`, 500);
      }
    })();
  }

  /**
   * 处理非流式聊天并记录详细日志
   */
  private async handleNonStreamChatWithLogging(
    client: OpenAI,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig,
    requestId: string,
    startTime: number
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      const response = await client.chat.completions.create({
        ...request,
        stream: false,
      });

      const responseTime = Date.now() - startTime;

      // 记录响应到详细日志，包含原始响应数据
      if (chatLogger.isEnabled()) {
        await chatLogger.logRequestComplete(requestId, response, responseTime, false, undefined, undefined, response);
      }

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 尝试提取错误响应的原始数据（不包含本地堆栈信息）
      let rawErrorResponse = null;
      if (error && typeof error === 'object') {
        // 检查是否是 OpenAI SDK 的错误，包含响应信息
        if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as any;
          rawErrorResponse = {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data || (error as any).message,
            error: (error as any).message,
          };
        } else if ('message' in error) {
          // 创建一个过滤后的错误对象，排除本地堆栈信息
          const filteredError = { ...(error as any) };
          delete filteredError.stack; // 移除本地堆栈信息
          rawErrorResponse = {
            error: (error as any).message,
            ...filteredError,
          };
        } else {
          rawErrorResponse = error;
        }
      }

      // 记录错误到详细日志，包含原始错误响应
      if (chatLogger.isEnabled()) {
        await chatLogger.logRequestComplete(requestId, null, responseTime, false, undefined, error, rawErrorResponse);
      }

      logger.error('非流式聊天处理失败', {
        requestId,
        provider: this.extractProviderFromModel(request.model),
        model: modelConfig.name,
        error,
        rawErrorResponse,
      });
      throw new OllamaError(`聊天请求失败: ${error}`, 500);
    }
  }

  /**
   * 准备OpenAI请求参数
   */
  private async prepareOpenAIRequest(
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig
  ): Promise<OpenAI.Chat.Completions.ChatCompletionCreateParams> {
    // 处理消息内容，移除 prompt 标签 - 只对 messages 进行过滤处理
    let processedMessages = request.messages;
    if (Array.isArray(request.messages)) {
      processedMessages = processMessages(request.messages as any);
    }

    // 过滤工具
    let filteredTools = request.tools;
    if (request.tools && request.tools.length > 0) {
      const providerName = this.extractProviderFromModel(request.model);

      try {
        // 尝试使用工具过滤服务
        const filterResult = await this.toolFilterService.filterTools(request.tools, modelConfig, providerName);

        // 记录过滤结果
        if (filterResult.warnings.length > 0) {
          logger.warn('工具过滤警告', {
            model: request.model,
            warnings: filterResult.warnings,
            triggeredRules: filterResult.triggeredRules.map(r => r.name),
          });
        }

        if (filterResult.errors.length > 0) {
          logger.error('工具过滤错误', {
            model: request.model,
            errors: filterResult.errors,
            triggeredRules: filterResult.triggeredRules.map(r => r.name),
          });
        }

        if (filterResult.removedTools.length > 0) {
          logger.info('已移除的工具', {
            model: request.model,
            removedCount: filterResult.removedTools.length,
            removedTools: filterResult.removedTools.map(t => t.function?.name || 'unnamed'),
          });
        }

        // 如果不允许使用工具，抛出错误
        if (!filterResult.allowed) {
          throw new OllamaError(`工具过滤失败: ${filterResult.errors.join(', ')}`, 400);
        }

        filteredTools = filterResult.filteredTools.length > 0 ? filterResult.filteredTools : undefined;
      } catch (error) {
        // 如果工具过滤服务出错，回退到使用原始工具
        logger.warn('工具过滤服务出错，使用原始工具', {
          model: request.model,
          error: error instanceof Error ? error.message : String(error),
          toolCount: request.tools.length,
        });
        filteredTools = request.tools.length > 0 ? request.tools : undefined;
      }
    }

    // 记录最终的工具格式以便调试
    if (filteredTools && filteredTools.length > 0) {
      logger.debug('最终发送给 OpenAI API 的工具格式', {
        model: request.model,
        toolsCount: filteredTools.length,
        tools: filteredTools.map(tool => ({
          type: tool.type,
          functionName: tool.function?.name,
          hasParameters: !!tool.function?.parameters,
          hasRequired: Array.isArray(tool.function?.parameters?.required),
        })),
      });
    }

    // 先确定 max_tokens 的值
    const effectiveMaxTokens = request.max_tokens || modelConfig.capabilities.limits.max_output_tokens || 1000;

    // 检查是否是Claude思考模型，并获取前端可能传递的reasoning.max_tokens
    const isClaudeThinking =
      modelConfig.capabilities.supports.thinking &&
      (modelConfig.id.includes('claude') || modelConfig.id.includes('anthropic'));
    const reasoningMaxTokens = (request as any).reasoning?.max_tokens || 1024;

    // 如果是Claude思考模型，并且max_tokens小于reasoning.max_tokens，则增加max_tokens
    const finalMaxTokens = isClaudeThinking
      ? effectiveMaxTokens < reasoningMaxTokens
        ? effectiveMaxTokens + reasoningMaxTokens
        : effectiveMaxTokens
      : effectiveMaxTokens;

    const openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      ...request,
      model: this.getProviderModelName(request.model, modelConfig),
      messages: processedMessages,
      tools: filteredTools,
      temperature: request.temperature || 0.7,
      max_tokens: finalMaxTokens,
      top_p: request.top_p || 0.9,
      stream: request.stream || false,
    };

    // 为思考模型添加或修正 reasoning 参数
    if (modelConfig.capabilities.supports.thinking && modelConfig.capabilities.limits.reasoning_tokens) {
      const reasoningTokens = modelConfig.capabilities.limits.reasoning_tokens;
      // 确保 reasoning.max_tokens 大于等于 1024 且小于总token数
      const minReasoningTokens = 1024;
      // 计算总可用token数（提示tokens + 输出tokens）
      const totalAvailableTokens =
        modelConfig.capabilities.limits.max_prompt_tokens + modelConfig.capabilities.limits.max_output_tokens;

      // 简化实现，直接使用1024作为Claude模型的reasoning.max_tokens值
      // Claude模型对reasoning.max_tokens有特定要求，这个值经过测试可以正常工作
      const maxReasoningTokens = 1024;

      // 检查计算的 reasoning.max_tokens 是否有效
      if (maxReasoningTokens >= minReasoningTokens && maxReasoningTokens < finalMaxTokens) {
        // 检查请求中是否已经有 reasoning 参数
        const existingReasoning = (request as any).reasoning;

        // 始终确保 reasoning 参数存在且正确，且必须小于 max_tokens
        const finalReasoningMaxTokens =
          existingReasoning?.max_tokens &&
          existingReasoning.max_tokens >= minReasoningTokens &&
          existingReasoning.max_tokens < finalMaxTokens
            ? existingReasoning.max_tokens
            : maxReasoningTokens;

        (openaiRequest as any).reasoning = {
          max_tokens: finalReasoningMaxTokens,
        };

        logger.debug('为思考模型添加或修正 reasoning 参数', {
          model: request.model,
          original_max_tokens: request.max_tokens,
          adjusted_max_tokens: finalMaxTokens,
          reasoning_max_tokens: (openaiRequest as any).reasoning.max_tokens,
          reasoning_ratio: `${(((openaiRequest as any).reasoning.max_tokens / finalMaxTokens) * 100).toFixed(1)}%`,
          frontend_provided: !!existingReasoning,
          is_claude_thinking: isClaudeThinking,
          context_window: modelConfig.capabilities.limits.max_context_window_tokens,
        });
      } else {
        logger.warn('无法为思考模型添加 reasoning 参数，可用 tokens 不足', {
          model: request.model,
          minReasoningTokens: minReasoningTokens,
          calculatedMaxTokens: maxReasoningTokens,
          configured_reasoning_tokens: reasoningTokens,
          totalAvailableTokens: totalAvailableTokens,
        });
      }
    }

    // 如果工具被完全过滤掉，也需要移除 tool_choice
    if (!filteredTools || filteredTools.length === 0) {
      delete openaiRequest.tool_choice;
    }

    // 使用通用的OpenAI请求格式，所有供应商特定参数应在配置文件中处理
    return openaiRequest;
  }

  /**
   * 获取模型对应的OpenAI客户端
   */
  private getClientForModel(requestModel: string, modelConfig: ModelConfig): OpenAI {
    const provider = this.extractProviderFromModel(requestModel);
    const client = this.providers.get(provider);
    if (!client) {
      throw new OllamaError(`未找到${provider}提供商的客户端`, 500);
    }
    return client;
  }

  /**
   * 获取提供商内部的模型名称
   */
  private getProviderModelName(requestModel: string, modelConfig: ModelConfig): string {
    // 从请求的模型名称中提取实际的模型名称（去掉provider前缀）
    if (requestModel.includes(':')) {
      // 使用第一个冒号进行分割，允许模型名称中包含更多冒号
      const colonIndex = requestModel.indexOf(':');
      return requestModel.substring(colonIndex + 1);
    }
    // 如果没有provider前缀，使用模型的id
    return modelConfig.id;
  }

  /**
   * 更新配置并重新初始化提供商
   */
  public updateConfig(newConfig: UnifiedAdapterConfig): void {
    try {
      logger.info('开始更新统一适配器配置');

      // 清理现有的提供商客户端
      this.providers.clear();

      // 更新配置
      this.config = newConfig;

      // 重新初始化提供商
      this.initializeProviders();

      logger.info('统一适配器配置更新成功', {
        providersCount: this.config.providers.length,
        activeProviders: Array.from(this.providers.keys()),
      });
    } catch (error) {
      logger.error('更新统一适配器配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): UnifiedAdapterConfig {
    return { ...this.config };
  }

  /**
   * 获取活跃的提供商列表
   */
  public getActiveProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查提供商是否可用
   */
  public isProviderAvailable(providerName: string): boolean {
    return this.providers.has(providerName);
  }

  /**
   * 更新工具过滤配置
   */
  public updateToolFilterConfig(newConfig: ToolFilterConfig): void {
    this.toolFilterService.updateConfig(newConfig);
    logger.info('工具过滤配置已更新');
  }

  /**
   * 获取工具过滤配置
   */
  public getToolFilterConfig(): ToolFilterConfig {
    return this.toolFilterService.getConfig();
  }

  /**
   * 清除工具过滤缓存
   */
  public clearToolFilterCache(): void {
    this.toolFilterService.clearCache();
  }

  /**
   * 获取工具过滤缓存统计
   */
  public getToolFilterCacheStats(): { size: number; maxSize: number } {
    return this.toolFilterService.getCacheStats();
  }
}

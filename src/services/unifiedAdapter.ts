import { OpenAI } from 'openai';
import { ModelConfig } from '../types';
import { UnifiedAdapterConfig, UnifiedProvider } from '../types/unifiedAdapter';
import { logger, OllamaError } from '../utils';
import { chatLogger } from '../utils/chatLogger';
import { processMessages } from '../utils/messageProcessor';
import { RequestQueue } from '../utils/requestQueue';
import { ModelDiscoveryService } from './modelDiscovery';
import { ToolRepairService } from './toolRepair';

/**
 * 统一适配器服务类
 * 使用OpenAI SDK统一处理所有AI服务提供商的请求
 */
export class UnifiedAdapterService {
  private providers: Map<string, OpenAI> = new Map();
  private modelDiscovery: ModelDiscoveryService;
  private config: UnifiedAdapterConfig;
  private requestQueue: RequestQueue;
  private toolRepairService: ToolRepairService;

  constructor(modelDiscovery: ModelDiscoveryService, config: UnifiedAdapterConfig) {
    this.modelDiscovery = modelDiscovery;
    this.config = config;
    this.requestQueue = new RequestQueue();

    // 初始化工具修复服务（使用内部硬编码配置）
    this.toolRepairService = new ToolRepairService();

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
          const displayName = provider.displayName;
          logger.info(`跳过初始化 ${displayName} 提供商，因为它被禁用了`);
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
        const displayName = provider.displayName;
        const providerName = provider.name;
        const baseURL = provider.baseURL;
        logger.debug(`初始化${displayName}提供商成功，提供商: ${providerName}，baseURL: ${baseURL}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const displayName = provider.displayName;
        const providerName = provider.name;
        logger.error(`初始化${displayName}提供商失败，提供商: ${providerName}，错误: ${errorMessage}`);
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

      // 在任何处理之前，保存原始请求的深拷贝
      const originalRequest = JSON.parse(JSON.stringify(request));

      try {
        // 获取模型配置
        modelConfig = await this.modelDiscovery.getModelConfig(request.model);
        if (!modelConfig) {
          const model = request.model;
          throw new OllamaError(`不支持的模型: ${model}`, 400);
        }

        // 获取对应的OpenAI客户端
        const client = this.getClientForModel(request.model, modelConfig);

        // 准备OpenAI请求参数
        const openaiRequest = await this.prepareOpenAIRequest(request, modelConfig);

        // 记录详细请求日志（如果启用），使用真正的原始请求
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestStart(requestId, originalRequest, openaiRequest, modelConfig);
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

        const errorMessage = error instanceof Error ? error.message : String(error);
        const model = request.model;
        logger.error(`统一聊天请求失败，requestId: ${requestId}，model: ${model}，错误: ${errorMessage}`);
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
          allChunks.push(chunk);

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

        const errorMessage = error instanceof Error ? error.message : String(error);
        const provider = extractProviderFromModel(request.model);
        const modelName = modelConfig.name;
        logger.error(
          `流式聊天处理失败，requestId: ${requestId}，provider: ${provider}，model: ${modelName}，错误: ${errorMessage}`
        );
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

      const errorMessage = error instanceof Error ? error.message : String(error);
      const provider = this.extractProviderFromModel(request.model);
      const modelName = modelConfig.name;
      logger.error(
        `非流式聊天处理失败，requestId: ${requestId}，provider: ${provider}，model: ${modelName}，错误: ${errorMessage}`
      );
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

    // 修复工具
    let repairedTools = request.tools;
    if (request.tools && request.tools.length > 0) {
      const providerName = this.extractProviderFromModel(request.model);

      try {
        // 尝试使用工具修复服务
        const repairResult = await this.toolRepairService.repairTools(request.tools, modelConfig, providerName);

        // 记录修复结果
        if (repairResult.warnings.length > 0) {
          const warningsText = repairResult.warnings.join(', ');
          const rulesText = repairResult.triggeredRules.join(', ');
          const model = request.model;
          logger.warn(`工具修复警告，model: ${model}，警告: ${warningsText}，触发规则: ${rulesText}`);
        }

        if (repairResult.errors.length > 0) {
          const errorsText = repairResult.errors.join(', ');
          const rulesText = repairResult.triggeredRules.join(', ');
          const model = request.model;
          logger.error(`工具修复错误，model: ${model}，错误: ${errorsText}，触发规则: ${rulesText}`);
        }

        if (repairResult.removedTools.length > 0) {
          const removedToolsText = repairResult.removedTools.map((t: any) => t.function?.name || 'unnamed').join(', ');
          const model = request.model;
          const removedCount = repairResult.removedTools.length;
          logger.info(`已移除的工具，model: ${model}，移除数量: ${removedCount}，移除工具: ${removedToolsText}`);
        }

        // 如果不允许使用工具，抛出错误
        if (!repairResult.allowed) {
          const errorsText = repairResult.errors.join(', ');
          throw new OllamaError(`工具修复失败: ${errorsText}`, 400);
        }

        repairedTools = repairResult.repairedTools.length > 0 ? repairResult.repairedTools : undefined;
      } catch (error) {
        // 如果工具修复服务出错，回退到使用原始工具
        const errorMessage = error instanceof Error ? error.message : String(error);
        const model = request.model;
        const toolsCount = request.tools.length;
        logger.warn(`工具修复服务出错，使用原始工具，模型: ${model}，错误: ${errorMessage}，工具数量: ${toolsCount}`);
        repairedTools = request.tools.length > 0 ? request.tools : undefined;
      }
    }

    // 记录最终的工具格式以便调试
    if (repairedTools && repairedTools.length > 0) {
      const toolsInfo = repairedTools.map(tool => ({
        type: tool.type,
        functionName: tool.function?.name,
        hasParameters: !!tool.function?.parameters,
        hasRequired: Array.isArray(tool.function?.parameters?.required),
      }));
      const model = request.model;
      const toolsCount = repairedTools.length;
      const toolsInfoJson = JSON.stringify(toolsInfo);
      logger.debug(
        `最终发送给 OpenAI API 的工具格式，模型: ${model}，工具数量: ${toolsCount}，工具信息: ${toolsInfoJson}`
      );
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
      tools: repairedTools,
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

        const reasoningMaxTokens = (openaiRequest as any).reasoning.max_tokens;
        const reasoningRatio = `${((reasoningMaxTokens / finalMaxTokens) * 100).toFixed(1)}%`;
        const model = request.model;
        const originalMaxTokens = request.max_tokens;
        const contextWindowTokens = modelConfig.capabilities.limits.max_context_window_tokens;
        logger.debug(
          `为思考模型添加或修正 reasoning 参数，模型: ${model}，原始最大tokens: ${originalMaxTokens}，调整后最大tokens: ${finalMaxTokens}，reasoning最大tokens: ${reasoningMaxTokens}，reasoning比例: ${reasoningRatio}，前端提供: ${!!existingReasoning}，是Claude思考: ${isClaudeThinking}，上下文窗口: ${contextWindowTokens}`
        );
      } else {
        const model = request.model;
        logger.warn(
          `无法为思考模型添加 reasoning 参数，可用 tokens 不足，模型: ${model}，最小reasoning tokens: ${minReasoningTokens}，计算的最大tokens: ${maxReasoningTokens}，配置的reasoning tokens: ${reasoningTokens}，总可用tokens: ${totalAvailableTokens}`
        );
      }
    }

    // 为有thinking_type配置的模型处理thinking策略
    if (modelConfig.capabilities?.limits?.thinking_type) {
      this.handleThinkingStrategy(openaiRequest, modelConfig, request);
    }

    // 如果工具被完全修复掉，也需要移除 tool_choice
    if (!repairedTools || repairedTools.length === 0) {
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

      const activeProviders = Array.from(this.providers.keys());
      const providersCount = this.config.providers.length;
      const activeProvidersText = activeProviders.join(', ');
      logger.info(`统一适配器配置更新成功，提供商数量: ${providersCount}，活跃提供商: ${activeProvidersText}`);
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
   * 处理支持thinking策略的模型配置
   */
  private handleThinkingStrategy(
    openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig,
    originalRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams
  ): void {
    try {
      // 从模型配置中获取thinking_type设置
      const limits = modelConfig.capabilities.limits as any;
      const thinkingType = limits?.thinking_type;

      if (!thinkingType) {
        logger.debug(`模型 ${modelConfig.id} 未配置 thinking_type，跳过处理`);
        return;
      }

      logger.debug(`模型 ${modelConfig.id} 的 thinking_type 配置: ${thinkingType}`); // 使用类型断言处理自定义参数，类似其他地方的做法
      const openaiRequestAny = openaiRequest as any;
      const originalRequestAny = originalRequest as any;

      // 根据thinking_type配置设置相应参数，使用豆包官方API格式 thinking: { type: "value" }
      switch (thinkingType) {
        case 'enabled':
          // 强制开启思考模式
          openaiRequestAny.thinking = { type: 'enabled' };
          logger.debug(`为模型 ${modelConfig.id} 启用思考模式`);
          break;

        case 'disabled':
          // 强制关闭思考模式
          openaiRequestAny.thinking = { type: 'disabled' };
          logger.debug(`为模型 ${modelConfig.id} 禁用思考模式`);
          break;

        case 'auto':
          // 让模型自主判断是否使用思考模式
          openaiRequestAny.thinking = { type: 'auto' };
          logger.debug(`为模型 ${modelConfig.id} 设置自动思考模式`);
          break;

        default:
          logger.warn(`模型 ${modelConfig.id} 的 thinking_type 配置未知: ${thinkingType}`);
          break;
      }

      // 如果原始请求中有thinking相关参数，优先使用原始请求的设置
      if (originalRequestAny.thinking) {
        openaiRequestAny.thinking = originalRequestAny.thinking;
        logger.debug(`使用原始请求中的 thinking 设置:`, originalRequestAny.thinking);
      }
    } catch (error) {
      logger.error(`处理模型 ${modelConfig.id} 的 thinking 策略时出错:`, error);
    }
  }
}

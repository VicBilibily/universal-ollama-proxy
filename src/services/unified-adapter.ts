import { OpenAI } from 'openai';
import { ModelConfig } from '../types';
import { UnifiedAdapterConfig, UnifiedProvider } from '../types/unified-adapter';
import { logger, OllamaError } from '../utils';
import { chatLogger } from '../utils/chatLogger';
import { processMessages } from '../utils/messageProcessor';
import { RequestQueue } from '../utils/requestQueue';
import { ModelDiscoveryService } from './modelDiscovery';

/**
 * 统一适配器服务类
 * 使用OpenAI SDK统一处理所有AI服务提供商的请求
 */
export class UnifiedAdapterService {
  private providers: Map<string, OpenAI> = new Map();
  private modelDiscovery: ModelDiscoveryService;
  private config: UnifiedAdapterConfig;
  private requestQueue: RequestQueue;

  constructor(modelDiscovery: ModelDiscoveryService, config: UnifiedAdapterConfig) {
    this.modelDiscovery = modelDiscovery;
    this.config = config;
    this.requestQueue = new RequestQueue();
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

        // 处理消息内容，移除 prompt 标签 - 只对 messages 进行过滤处理
        if (Array.isArray(request.messages)) {
          (request as any).messages = processMessages(request.messages as any);
        }

        // 获取对应的OpenAI客户端
        const client = this.getClientForModel(request.model, modelConfig);

        // 准备OpenAI请求参数
        const openaiRequest = this.prepareOpenAIRequest(request, modelConfig);

        // 记录详细请求日志（如果启用）
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestStart(requestId, openaiRequest, modelConfig);
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
          await chatLogger.logRequestComplete(requestId, null, responseTime, !!request.stream, undefined, error);
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
        const responseTime = Date.now() - startTime;

        for await (const chunk of stream) {
          chunkCount++;

          // 记录流式响应块到详细日志
          if (chatLogger.isEnabled()) {
            await chatLogger.logStreamChunk(requestId, chunk);
          }

          yield chunk;
        }

        // 记录流式完成到详细日志
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestComplete(requestId, null, responseTime, true, chunkCount);
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // 记录错误到详细日志
        if (chatLogger.isEnabled()) {
          await chatLogger.logRequestComplete(requestId, null, responseTime, true, undefined, error);
        }

        logger.error('流式聊天处理失败', {
          requestId,
          provider: extractProviderFromModel(request.model),
          model: modelConfig.name,
          error,
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

      // 记录响应到详细日志
      if (chatLogger.isEnabled()) {
        await chatLogger.logRequestComplete(requestId, response, responseTime, false);
      }

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 记录错误到详细日志
      if (chatLogger.isEnabled()) {
        await chatLogger.logRequestComplete(requestId, null, responseTime, false, undefined, error);
      }

      logger.error('非流式聊天处理失败', {
        requestId,
        provider: this.extractProviderFromModel(request.model),
        model: modelConfig.name,
        error,
      });
      throw new OllamaError(`聊天请求失败: ${error}`, 500);
    }
  }

  /**
   * 准备OpenAI请求参数
   */
  private prepareOpenAIRequest(
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig
  ): OpenAI.Chat.Completions.ChatCompletionCreateParams {
    const openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      ...request,
      model: this.getProviderModelName(request.model, modelConfig),
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || modelConfig.capabilities.limits.max_output_tokens || 1000,
      top_p: request.top_p || 0.9,
      stream: request.stream || false,
    };

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
      return requestModel.split(':')[1];
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
}

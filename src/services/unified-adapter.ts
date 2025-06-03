// 统一的OpenAI适配器服务
import { OpenAI } from 'openai';
import { ModelConfig } from '../types';
import { UnifiedAdapterConfig, UnifiedProvider } from '../types/unified-adapter';
import { logger, OllamaError } from '../utils';
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
   * 初始化所有提供商的OpenAI客户端
   */
  private initializeProviders(): void {
    for (const provider of this.config.providers) {
      try {
        const client = new OpenAI({
          baseURL: provider.baseURL,
          apiKey: provider.apiKey,
          defaultHeaders: this.getProviderHeaders(provider),
          timeout: 300000, // 5分钟超时
          // 注意：OpenAI SDK 内部会处理HTTP连接，我们通过全局axios配置来优化连接池
        });

        this.providers.set(provider.name, client);
        logger.info(`初始化${provider.displayName}提供商成功`, {
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
    const headers: Record<string, string> = {};

    switch (provider.name) {
      case 'volcengine':
        headers['Content-Type'] = 'application/json';
        break;
      case 'dashscope':
        headers['Content-Type'] = 'application/json';
        headers['X-DashScope-SSE'] = 'enable';
        break;
      case 'tencentds':
        headers['Content-Type'] = 'application/json';
        break;
      case 'deepseek':
        headers['Content-Type'] = 'application/json';
        break;
    }

    return headers;
  }

  /**
   * 聊天接口 - 使用OpenAI SDK原生类型
   */
  async chat(
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    return this.requestQueue.add(async () => {
      try {
        // 获取模型配置
        const modelConfig = await this.modelDiscovery.getModelConfig(request.model);
        if (!modelConfig) {
          throw new OllamaError(`不支持的模型: ${request.model}`, 400);
        }

        // 处理消息内容，移除 prompt 标签 - 只对 messages 进行过滤处理
        if (Array.isArray(request.messages)) {
          (request as any).messages = processMessages(request.messages as any);
        }

        // 记录详细的请求信息和供应商信息
        logger.info('统一处理聊天请求', {
          model: request.model,
          stream: request.stream,
          provider: modelConfig.provider,
        });

        // 获取对应的OpenAI客户端
        const client = this.getClientForModel(modelConfig);

        // 准备OpenAI请求参数
        const openaiRequest = this.prepareOpenAIRequest(request, modelConfig);
        logger.debug('转发请求详情', openaiRequest);

        if (request.stream) {
          return this.handleStreamChat(client, openaiRequest, modelConfig);
        } else {
          return this.handleNonStreamChat(client, openaiRequest, modelConfig);
        }
      } catch (error) {
        logger.error('统一聊天请求失败', { model: request.model, error });
        if (error instanceof OllamaError) {
          throw error;
        }
        throw new OllamaError(`聊天请求失败: ${error}`, 500);
      }
    });
  }
  /**
   * 处理流式聊天
   */
  private async *handleStreamChat(
    client: OpenAI,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown> {
    try {
      logger.debug('开始流式请求', {
        provider: modelConfig.provider,
        model: modelConfig.name,
        endpoint: modelConfig.endpoint || modelConfig.name,
      });

      const stream = await client.chat.completions.create({
        ...request,
        stream: true,
      });

      let chunkCount = 0;
      let startTime = Date.now();

      for await (const chunk of stream) {
        chunkCount++;

        // 记录流式完成事件（仅记录第一个块和最后一个块）
        if (chunkCount === 1 || chunk.choices[0]?.finish_reason === 'stop') {
          const status = chunkCount === 1 ? '首个响应块' : '流式响应完成';
          logger.debug(`${status}`, {
            provider: modelConfig.provider,
            model: modelConfig.name,
            chunkCount: chunkCount,
            elapsedMs: Date.now() - startTime,
            isComplete: chunk.choices[0]?.finish_reason === 'stop',
          });
        }

        // 直接返回OpenAI SDK的原生块，无需转换
        yield chunk;
      }
    } catch (error) {
      logger.error('流式聊天处理失败', {
        provider: modelConfig.provider,
        model: modelConfig.name,
        error,
      });
      throw new OllamaError(`流式聊天失败: ${error}`, 500);
    }
  }

  /**
   * 处理非流式聊天
   */
  private async handleNonStreamChat(
    client: OpenAI,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      logger.debug('开始非流式请求', {
        provider: modelConfig.provider,
        model: modelConfig.name,
        endpoint: modelConfig.endpoint || modelConfig.name,
      });

      const startTime = Date.now();
      const response = await client.chat.completions.create({
        ...request,
        stream: false,
      });

      const duration = Date.now() - startTime;

      // 记录响应统计信息
      logger.info('非流式请求完成', {
        provider: modelConfig.provider,
        model: modelConfig.name,
        responseId: response.id,
        responseTimeMs: duration,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        contentLength: response.choices[0]?.message?.content?.length || 0,
      });

      // 直接返回OpenAI SDK的原生响应，无需转换
      return response;
    } catch (error) {
      logger.error('非流式聊天处理失败', {
        provider: modelConfig.provider,
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
      max_tokens: request.max_tokens || modelConfig.defaultOutputLength || 1000,
      top_p: request.top_p || 0.9,
      stream: request.stream || false,
    };

    // 添加提供商特定的参数
    if (modelConfig.provider === 'dashscope') {
      (openaiRequest as any).repetition_penalty = 1.0;
      (openaiRequest as any).enable_search = false;
    }

    return openaiRequest;
  }

  /**
   * 获取模型对应的OpenAI客户端
   */
  private getClientForModel(modelConfig: ModelConfig): OpenAI {
    const client = this.providers.get(modelConfig.provider!);
    if (!client) {
      throw new OllamaError(`未找到${modelConfig.provider}提供商的客户端`, 500);
    }
    return client;
  }

  /**
   * 获取提供商内部的模型名称
   */
  private getProviderModelName(requestModel: string, modelConfig: ModelConfig): string {
    // 对于DashScope，去掉可能的前缀
    if (modelConfig.provider === 'dashscope') {
      return modelConfig.endpoint || modelConfig.name;
    }

    // 对于VolcEngine，使用配置的端点或名称
    if (modelConfig.provider === 'volcengine') {
      return modelConfig.endpoint || modelConfig.name;
    }

    // 对于腾讯DS，使用端点或名称
    if (modelConfig.provider === 'tencentds') {
      return modelConfig.endpoint || modelConfig.name;
    }

    // 对于DeepSeek，使用端点或名称
    if (modelConfig.provider === 'deepseek') {
      return modelConfig.endpoint || modelConfig.name;
    }

    return modelConfig.name;
  }

  /**
   * 获取所有可用模型
   */
  async getAvailableModels(): Promise<string[]> {
    return this.modelDiscovery.getAvailableModels();
  }

  /**
   * 获取模型配置
   */
  async getModelConfig(modelName: string): Promise<ModelConfig | null> {
    return this.modelDiscovery.getModelConfig(modelName);
  }

  /**
   * 刷新提供商配置
   */
  async refreshProviders(): Promise<void> {
    logger.info('刷新提供商配置');
    this.providers.clear();
    this.initializeProviders();
  }
}

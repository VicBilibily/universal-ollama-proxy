import {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaListResponse,
  OllamaShowResponse,
} from '../types';
import { ChatRequest, ChatResponse, ChatStreamChunk } from '../types/unified-adapter';
import { logger, OllamaError } from '../utils';
import { OllamaCompatibilityService } from './ollama-compatibility';
import { UnifiedAdapterService } from './unified-adapter';

/**
 * Ollama 服务类
 * 提供 Ollama API 兼容的接口，使用统一的OpenAI格式适配器
 */
export class OllamaService {
  private unifiedAdapter: UnifiedAdapterService;
  private compatibilityService: OllamaCompatibilityService;

  constructor(unifiedAdapter: UnifiedAdapterService, compatibilityService: OllamaCompatibilityService) {
    this.unifiedAdapter = unifiedAdapter;
    this.compatibilityService = compatibilityService;
  }

  /**
   * 解析模型名称 - 现在直接返回模型ID（已移除前缀）
   */
  private parseModelName(modelId: string): string {
    // 不再需要解析前缀，直接返回模型ID
    return modelId;
  }

  /**
   * 处理聊天请求 - 核心功能，使用统一适配器
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse | AsyncIterable<string>> {
    try {
      logger.info('处理聊天请求', {
        model: request.model,
        stream: request.stream,
      });

      // 解析模型名称（去掉供应商前缀）
      const actualModelName = this.parseModelName(request.model);

      // 转换Ollama格式到统一格式
      const unifiedRequest: ChatRequest = {
        model: actualModelName,
        messages: request.messages.map(msg => ({
          role: msg.role as any,
          content: msg.content,
        })),
        temperature: request.options?.temperature,
        max_tokens: request.options?.num_predict,
        top_p: request.options?.top_p,
        stream: request.stream,
      };

      try {
        const result = await this.unifiedAdapter.chat(unifiedRequest);

        if (request.stream) {
          return this.convertStreamToOllama(result as AsyncIterable<ChatStreamChunk>);
        } else {
          return this.convertResponseToOllama(result as ChatResponse);
        }
      } catch (apiError: any) {
        // 如果是认证错误或API不可用，回退到兼容性服务
        if (
          apiError.message?.includes('401') ||
          apiError.message?.includes('API key') ||
          apiError.message?.includes('invalid')
        ) {
          logger.warn('API认证失败，回退到模拟响应', { model: request.model });
          return this.compatibilityService.chat(request);
        }
        throw apiError;
      }
    } catch (error) {
      logger.error('聊天请求失败', { model: request.model, error });
      if (error instanceof OllamaError) {
        throw error;
      }
      throw new OllamaError(`聊天请求失败: ${error}`, 500);
    }
  }

  /**
   * 处理生成请求 - 核心功能，转换为聊天格式
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse | AsyncIterable<string>> {
    try {
      logger.info('处理生成请求', {
        model: request.model,
        stream: request.stream,
      });

      // 解析模型名称（去掉供应商前缀）
      const actualModelName = this.parseModelName(request.model);

      // 将生成请求转换为聊天请求
      const chatRequest: ChatRequest = {
        model: actualModelName,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.options?.temperature,
        max_tokens: request.options?.num_predict,
        top_p: request.options?.top_p,
        stream: request.stream,
        stop: request.options?.stop,
      };

      try {
        const result = await this.unifiedAdapter.chat(chatRequest);

        if (request.stream) {
          return this.convertStreamToOllamaGenerate(result as AsyncIterable<ChatStreamChunk>);
        } else {
          return this.convertResponseToOllamaGenerate(result as ChatResponse);
        }
      } catch (apiError: any) {
        // 如果是认证错误或API不可用，回退到兼容性服务
        if (
          apiError.message?.includes('401') ||
          apiError.message?.includes('API key') ||
          apiError.message?.includes('invalid')
        ) {
          logger.warn('API认证失败，回退到模拟响应', { model: request.model });
          return this.compatibilityService.generate(request);
        }
        throw apiError;
      }
    } catch (error) {
      logger.error('生成请求失败', { model: request.model, error });
      if (error instanceof OllamaError) {
        throw error;
      }
      throw new OllamaError(`生成请求失败: ${error}`, 500);
    }
  }
  /**
   * 获取模型列表 - 兼容性功能
   */
  async list(): Promise<OllamaListResponse> {
    return this.compatibilityService.list();
  }

  /**
   * 显示模型信息 - 兼容性功能
   */
  async show(model: string): Promise<OllamaShowResponse> {
    // 解析模型名称（去掉供应商前缀）
    const actualModelName = this.parseModelName(model);
    return this.compatibilityService.show(actualModelName);
  }

  /**
   * 流式聊天方法（供向后兼容）
   */
  async *chatStream(request: OllamaChatRequest): AsyncIterable<string> {
    const streamRequest = { ...request, stream: true };
    const result = await this.chat(streamRequest);

    if (Symbol.asyncIterator in Object(result)) {
      yield* result as AsyncIterable<string>;
    } else {
      // 如果返回的不是流，将其转换为流格式
      const response = result as OllamaChatResponse;
      yield JSON.stringify(response) + '\n';
    }
  }

  /**
   * 模型管理方法 - 兼容性功能（非核心）
   */
  async createModel(model: string, modelfile: string): Promise<void> {
    return this.compatibilityService.createModel(model, modelfile);
  }

  async copyModel(source: string, destination: string): Promise<void> {
    return this.compatibilityService.copyModel(source, destination);
  }

  async deleteModel(model: string): Promise<void> {
    return this.compatibilityService.deleteModel(model);
  }

  async pullModel(model: string): Promise<void> {
    return this.compatibilityService.pullModel(model);
  }

  async pushModel(model: string): Promise<void> {
    return this.compatibilityService.pushModel(model);
  }

  /**
   * 转换流式响应为Ollama聊天格式
   */
  private async *convertStreamToOllama(stream: AsyncIterable<ChatStreamChunk>): AsyncIterable<string> {
    for await (const chunk of stream) {
      const ollamaChunk = {
        model: chunk.model,
        created_at: new Date(chunk.created * 1000).toISOString(),
        message: {
          role: 'assistant',
          content: chunk.choices[0]?.delta?.content || '',
        },
        done: chunk.choices[0]?.finish_reason === 'stop',
      };

      yield JSON.stringify(ollamaChunk) + '\n';
    }
  }

  /**
   * 转换流式响应为Ollama生成格式
   */
  private async *convertStreamToOllamaGenerate(stream: AsyncIterable<ChatStreamChunk>): AsyncIterable<string> {
    for await (const chunk of stream) {
      const ollamaChunk = {
        model: chunk.model,
        created_at: new Date(chunk.created * 1000).toISOString(),
        response: chunk.choices[0]?.delta?.content || '',
        done: chunk.choices[0]?.finish_reason === 'stop',
      };

      yield JSON.stringify(ollamaChunk) + '\n';
    }
  }

  /**
   * 转换响应为Ollama聊天格式
   */
  private convertResponseToOllama(response: ChatResponse): OllamaChatResponse {
    return {
      model: response.model,
      created_at: new Date(response.created * 1000).toISOString(),
      message: {
        role: 'assistant',
        content: response.choices[0]?.message?.content || '',
      },
      done: true,
      total_duration: 0,
      load_duration: 0,
      prompt_eval_count: response.usage.prompt_tokens,
      prompt_eval_duration: 0,
      eval_count: response.usage.completion_tokens,
      eval_duration: 0,
    };
  }

  /**
   * 转换响应为Ollama生成格式
   */
  private convertResponseToOllamaGenerate(response: ChatResponse): OllamaGenerateResponse {
    return {
      model: response.model,
      created_at: new Date(response.created * 1000).toISOString(),
      response: response.choices[0]?.message?.content || '',
      done: true,
      context: [],
      total_duration: 0,
      load_duration: 0,
      prompt_eval_count: response.usage.prompt_tokens,
      prompt_eval_duration: 0,
      eval_count: response.usage.completion_tokens,
      eval_duration: 0,
    };
  }
}

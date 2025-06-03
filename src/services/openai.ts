import {
  OpenAIChatRequest,
  OpenAIChatResponse,
  OpenAIChatStreamResponse,
  OpenAIChatMessage,
  OllamaChatRequest,
  OllamaChatMessage,
  OllamaChatResponse,
} from '../types';
import { OllamaService } from './ollama';
import { logger } from '../utils';

/**
 * OpenAI API 兼容服务
 * 将 OpenAI 格式的请求转换为 Ollama 格式，并将响应转换回 OpenAI 格式
 */
export class OpenAICompatService {
  private ollamaService: OllamaService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * 处理 OpenAI 格式的聊天请求
   */
  async chatCompletions(request: OpenAIChatRequest): Promise<OpenAIChatResponse> {
    logger.info('处理 OpenAI 格式聊天请求', {
      model: request.model,
      stream: request.stream,
    }); // 转换请求格式
    const ollamaRequest: OllamaChatRequest = {
      model: request.model,
      messages: this.convertOpenAIToOllamaMessages(request.messages),
      stream: false, // 明确指定非流式
      options: {
        temperature: request.temperature,
        num_predict: request.max_tokens,
        top_p: request.top_p,
      },
    };

    // 调用 Ollama 服务
    const ollamaResponse = (await this.ollamaService.chat(ollamaRequest)) as OllamaChatResponse;

    // 转换响应格式
    return this.convertOllamaToOpenAIResponse(ollamaResponse, request.model);
  }

  /**
   * 处理 OpenAI 格式的流式聊天请求
   */
  async *chatCompletionsStream(request: OpenAIChatRequest): AsyncGenerator<OpenAIChatStreamResponse> {
    logger.info('处理 OpenAI 格式流式聊天请求', { model: request.model });

    // 转换请求格式
    const ollamaRequest: OllamaChatRequest = {
      model: request.model,
      messages: this.convertOpenAIToOllamaMessages(request.messages),
      stream: true,
      options: {
        temperature: request.temperature,
        num_predict: request.max_tokens,
        top_p: request.top_p,
      },
    };

    const streamId = this.generateId();
    const created = Math.floor(Date.now() / 1000);
    let isFirst = true; // 调用 Ollama 流式服务
    for await (const chunkString of this.ollamaService.chatStream(ollamaRequest)) {
      try {
        // 解析 JSON 字符串
        const chunk = JSON.parse(chunkString.trim()) as Partial<OllamaChatResponse>;

        if (chunk.message?.content) {
          yield {
            id: streamId,
            object: 'chat.completion.chunk',
            created,
            model: request.model,
            choices: [
              {
                index: 0,
                delta: {
                  role: isFirst ? 'assistant' : undefined,
                  content: chunk.message.content,
                },
                finish_reason: null,
              },
            ],
          };
          isFirst = false;
        }

        if (chunk.done) {
          // 发送结束块
          yield {
            id: streamId,
            object: 'chat.completion.chunk',
            created,
            model: request.model,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
          };
        }
      } catch (parseError) {
        // 跳过无法解析的数据块
        logger.warn('跳过无法解析的流数据块', {
          chunk: chunkString,
          error: parseError,
        });
      }
    }
  }

  /**
   * 转换 OpenAI 消息格式为 Ollama 格式
   */
  private convertOpenAIToOllamaMessages(messages: OpenAIChatMessage[]): OllamaChatMessage[] {
    return messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content || '',
      // OpenAI 的 images 字段在这里暂时不处理
    }));
  }

  /**
   * 转换 Ollama 响应为 OpenAI 格式
   */
  private convertOllamaToOpenAIResponse(ollamaResponse: OllamaChatResponse, model: string): OpenAIChatResponse {
    return {
      id: this.generateId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: ollamaResponse.message.content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: ollamaResponse.prompt_eval_count || 0,
        completion_tokens: ollamaResponse.eval_count || 0,
        total_tokens: (ollamaResponse.prompt_eval_count || 0) + (ollamaResponse.eval_count || 0),
      },
    };
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `chatcmpl-${Math.random().toString(36).substr(2, 9)}`;
  }
}

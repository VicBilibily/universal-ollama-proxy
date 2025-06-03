import { OpenAIChatMessage, OpenAIChatRequest, OpenAIChatResponse, OpenAIChatStreamResponse } from '../types';
import { ChatRequest, ChatResponse, ChatStreamChunk } from '../types/unified-adapter';
import { logger } from '../utils';
import { UnifiedAdapterService } from './unified-adapter';

/**
 * OpenAI API 兼容服务
 * 直接调用 UnifiedAdapterService 进行请求处理
 */
export class OpenAICompatService {
  private unifiedAdapter: UnifiedAdapterService;

  constructor(unifiedAdapter: UnifiedAdapterService) {
    this.unifiedAdapter = unifiedAdapter;
  }

  /**
   * 处理 OpenAI 格式的聊天请求
   */
  async chatCompletions(
    request: OpenAIChatRequest
  ): Promise<OpenAIChatResponse | AsyncIterable<OpenAIChatStreamResponse>> {
    logger.info('处理 OpenAI 格式聊天请求', {
      model: request.model,
      stream: request.stream,
    });

    // 转换请求格式到统一格式
    const unifiedRequest: ChatRequest = {
      ...request,
      messages: this.convertOpenAIToUnifiedMessages(request.messages),
    };

    // 直接调用 UnifiedAdapterService
    const response = await this.unifiedAdapter.chat(unifiedRequest);

    // 根据是否为流式请求返回不同格式
    if (request.stream) {
      return this.convertStreamResponse(response as AsyncIterable<ChatStreamChunk>, request.model);
    } else {
      return this.convertUnifiedToOpenAIResponse(response as ChatResponse, request.model);
    }
  }

  /**
   * 转换 OpenAI 消息格式为统一格式
   */
  private convertOpenAIToUnifiedMessages(messages: OpenAIChatMessage[]): ChatRequest['messages'] {
    return messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content || '',
    }));
  }

  /**
   * 转换统一响应格式为 OpenAI 格式
   */
  private convertUnifiedToOpenAIResponse(unifiedResponse: ChatResponse, model: string): OpenAIChatResponse {
    return {
      id: unifiedResponse.id,
      object: 'chat.completion',
      created: unifiedResponse.created,
      model: model,
      choices: unifiedResponse.choices.map(choice => ({
        index: choice.index,
        message: {
          role: 'assistant',
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })),
      usage: unifiedResponse.usage,
    };
  }

  /**
   * 转换统一流式响应块为 OpenAI 格式
   */
  private convertUnifiedToOpenAIStreamChunk(chunk: ChatStreamChunk, model: string): OpenAIChatStreamResponse {
    return {
      id: chunk.id,
      object: 'chat.completion.chunk',
      created: chunk.created,
      model: model,
      choices: chunk.choices.map(choice => ({
        index: choice.index,
        delta: {
          role: choice.delta.role,
          content: choice.delta.content,
        },
        finish_reason: choice.finish_reason || null,
      })),
    };
  }

  /**
   * 转换流式响应
   */
  private async *convertStreamResponse(
    streamResult: AsyncIterable<ChatStreamChunk>,
    model: string
  ): AsyncGenerator<OpenAIChatStreamResponse> {
    for await (const chunk of streamResult) {
      yield this.convertUnifiedToOpenAIStreamChunk(chunk, model);
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `chatcmpl-${Math.random().toString(36).substr(2, 9)}`;
  }
}

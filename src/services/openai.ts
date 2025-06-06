import { OpenAI } from 'openai';
import { OpenAIChatRequest } from '../types';
import { logger } from '../utils';
import { UnifiedAdapterService } from './unifiedAdapter';

/**
 * OpenAI API 兼容服务
 * 通过统一适配器处理请求，直接转发给 OpenAI SDK
 */
export class OpenAICompatService {
  private unifiedAdapter: UnifiedAdapterService;

  constructor(unifiedAdapter: UnifiedAdapterService) {
    this.unifiedAdapter = unifiedAdapter;
  }

  /**
   * 处理 OpenAI 格式的聊天请求 - 通过统一适配器转发
   */
  async chatCompletions(
    request: OpenAIChatRequest
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    logger.info('通过统一适配器处理 OpenAI 聊天请求', {
      model: request.model,
      stream: request.stream,
    });

    try {
      // 验证模型名称必须为组合ID格式 (provider:modelName)
      // 但允许模型名称部分包含额外的冒号和斜杠，例如 openrouter:anthropic/claude-3.7-sonnet:thinking
      if (!request.model.includes(':')) {
        const error = new Error(`模型名称必须使用组合格式 'provider:modelName'，当前格式: ${request.model}`);
        logger.error('模型名称格式验证失败:', { model: request.model });
        throw error;
      }

      // 解析提供商和模型名称（允许模型名称中包含冒号和斜杠）
      const colonIndex = request.model.indexOf(':');
      const provider = request.model.substring(0, colonIndex);
      const modelName = request.model.substring(colonIndex + 1);

      if (!provider || !modelName) {
        const error = new Error(`模型名称格式无效，提供商或模型名称为空: ${request.model}`);
        logger.error('模型名称格式验证失败:', { model: request.model, provider, modelName });
        throw error;
      }

      // 构建 OpenAI SDK 兼容的请求参数
      const chatRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        ...request,
        model: request.model,
        messages: request.messages as any, // 使用类型断言处理复杂的消息类型
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.max_tokens !== undefined && { max_tokens: request.max_tokens }),
        ...(request.top_p !== undefined && { top_p: request.top_p }),
        ...(request.frequency_penalty !== undefined && { frequency_penalty: request.frequency_penalty }),
        ...(request.presence_penalty !== undefined && { presence_penalty: request.presence_penalty }),
        ...(request.stop !== undefined && { stop: request.stop }),
        ...(request.user !== undefined && { user: request.user }),
        ...(request.functions !== undefined && { functions: request.functions as any }),
        ...(request.function_call !== undefined && { function_call: request.function_call as any }),
        ...(request.tools !== undefined && { tools: request.tools as any }),
        ...(request.tool_choice !== undefined && { tool_choice: request.tool_choice as any }),
        ...(request.reasoning !== undefined && { reasoning: request.reasoning as any }),
        stream: request.stream || false,
      };

      // 通过统一适配器处理请求，直接返回结果
      return await this.unifiedAdapter.chat(chatRequest);
    } catch (error) {
      logger.error('OpenAI 聊天请求处理失败:', error);
      throw error;
    }
  }
}

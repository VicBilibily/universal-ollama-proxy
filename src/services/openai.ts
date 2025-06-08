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
    const model = request.model;
    const isStream = request.stream;
    logger.info(`通过统一适配器处理 OpenAI 聊天请求，模型: ${model}，流式: ${isStream}`);

    try {
      // 验证模型名称必须为组合ID格式 (provider:modelName)
      // 但允许模型名称部分包含额外的冒号和斜杠，例如 openrouter:anthropic/claude-3.7-sonnet:thinking
      if (!request.model.includes(':')) {
        const error = new Error(`模型名称必须使用组合格式 'provider:modelName'，当前格式: ${model}`);
        logger.error(`模型名称格式验证失败: ${model}`);
        throw error;
      }

      // 解析提供商和模型名称（允许模型名称中包含冒号和斜杠）
      const colonIndex = request.model.indexOf(':');
      const provider = request.model.substring(0, colonIndex);
      const modelName = request.model.substring(colonIndex + 1);

      if (!provider || !modelName) {
        const error = new Error(`模型名称格式无效，提供商或模型名称为空: ${request.model}`);
        logger.error(`模型名称格式验证失败，模型: ${request.model}，提供商: ${provider}，模型名称: ${modelName}`);
        throw error;
      }

      // 构建 OpenAI SDK 兼容的请求参数
      const chatRequest = {
        ...request,
        model: request.model,
        stream: request.stream || false,
      } as OpenAI.Chat.Completions.ChatCompletionCreateParams;

      // 通过统一适配器处理请求，直接返回结果
      return await this.unifiedAdapter.chat(chatRequest);
    } catch (error) {
      logger.error('OpenAI 聊天请求处理失败:', error);
      throw error;
    }
  }
}

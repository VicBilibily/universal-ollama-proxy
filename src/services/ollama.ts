import {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaListResponse,
  OllamaShowResponse,
} from '../types';
import { logger } from '../utils';
import { OllamaCompatibilityService } from './ollama-compatibility';

/**
 * Ollama 服务类
 * 只保留 getTags (list) 和 show 方法的实际实现，其他接口均为占位符返回模拟结果
 */
export class OllamaService {
  private compatibilityService: OllamaCompatibilityService;

  constructor(compatibilityService: OllamaCompatibilityService) {
    this.compatibilityService = compatibilityService;
  }

  /**
   * 处理聊天请求 - 占位符方法，使用兼容性服务的模拟实现
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse | AsyncIterable<string>> {
    logger.info('聊天请求 - 使用兼容性服务模拟', {
      model: request.model,
      stream: request.stream,
    });

    return this.compatibilityService.chat(request);
  }

  /**
   * 处理生成请求 - 占位符方法，使用兼容性服务的模拟实现
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse | AsyncIterable<string>> {
    logger.info('生成请求 - 使用兼容性服务模拟', {
      model: request.model,
      stream: request.stream,
    });

    return this.compatibilityService.generate(request);
  }

  /**
   * 获取模型列表 - 实际实现
   */
  async list(): Promise<OllamaListResponse> {
    return this.compatibilityService.list();
  }

  /**
   * 显示模型信息 - 实际实现
   */
  async show(model: string): Promise<OllamaShowResponse> {
    return this.compatibilityService.show(model);
  }

  /**
   * 流式聊天方法 - 占位符方法
   */
  async *chatStream(request: OllamaChatRequest): AsyncIterable<string> {
    const streamRequest = { ...request, stream: true };
    const result = await this.chat(streamRequest);

    if (Symbol.asyncIterator in Object(result)) {
      yield* result as AsyncIterable<string>;
    } else {
      const response = result as OllamaChatResponse;
      yield JSON.stringify(response) + '\n';
    }
  }

  /**
   * 创建模型 - 占位符方法，返回模拟结果
   */
  async createModel(model: string, modelfile: string): Promise<void> {
    logger.info('创建模型 - 模拟成功', { model });
    // 模拟一些延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 复制模型 - 占位符方法，返回模拟结果
   */
  async copyModel(source: string, destination: string): Promise<void> {
    logger.info('复制模型 - 模拟成功', { source, destination });
    // 模拟一些延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 删除模型 - 占位符方法，返回模拟结果
   */
  async deleteModel(model: string): Promise<void> {
    logger.info('删除模型 - 模拟成功', { model });
    // 模拟一些延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 拉取模型 - 占位符方法，返回模拟结果
   */
  async pullModel(model: string): Promise<void> {
    logger.info('拉取模型 - 模拟成功', { model });
    // 模拟一些延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * 推送模型 - 占位符方法，返回模拟结果
   */
  async pushModel(model: string): Promise<void> {
    logger.info('推送模型 - 模拟成功', { model });
    // 模拟一些延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

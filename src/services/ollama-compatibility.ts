// Ollama兼容性接口 - 非核心模拟方法
import crypto from 'crypto';
import {
  ModelConfig,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaListResponse,
  OllamaModel,
  OllamaShowResponse,
} from '../types';
import { logger, OllamaError } from '../utils';
import { ModelDiscoveryService } from './modelDiscovery';

/**
 * Ollama兼容性服务类
 * 提供Ollama API的兼容性支持，主要是模拟一些非核心功能
 * 这些方法主要用于与Ollama客户端的兼容性，不是核心功能
 */
export class OllamaCompatibilityService {
  private modelDiscovery: ModelDiscoveryService;

  constructor(modelDiscovery: ModelDiscoveryService) {
    this.modelDiscovery = modelDiscovery;
  }

  /**
   * 获取模型列表 - Ollama格式
   */
  async list(): Promise<OllamaListResponse> {
    try {
      logger.info('获取Ollama格式模型列表');

      const modelNames = await this.modelDiscovery.getAvailableModels();
      const models: OllamaModel[] = [];

      for (const modelName of modelNames) {
        const modelConfig = await this.modelDiscovery.getModelConfig(modelName);
        if (modelConfig) {
          // 直接使用原始模型名称，不添加供应商前缀
          const modelId = modelConfig.name;

          models.push({
            name: modelId,
            model: modelId,
            size: this.getModelSizeFromConfig(modelConfig),
            digest: this.generateModelDigest(modelConfig.name),
            modified_at: this.getFormattedTimestamp(),
            details: {
              parent_model: '',
              format: 'gguf',
              family: this.getModelFamilyFromConfig(modelConfig),
              families: [this.getModelFamilyFromConfig(modelConfig)],
              parameter_size: this.getParameterSizeFromConfig(modelConfig).toString(),
              quantization_level: 'Q4_0',
            },
          });
        }
      }

      return { models };
    } catch (error) {
      logger.error('获取Ollama格式模型列表失败', { error });
      throw new OllamaError(`获取模型列表失败: ${error}`, 500);
    }
  }

  /**
   * 显示模型信息 - Ollama格式
   */
  async show(model: string): Promise<OllamaShowResponse> {
    try {
      logger.info('显示Ollama格式模型信息', { model });

      const modelConfig = await this.modelDiscovery.getModelConfig(model);
      if (!modelConfig) {
        throw new OllamaError(`模型不存在: ${model}`, 404);
      }

      // 构建模型能力列表
      const capabilities = ['chat', 'completion', 'tools'];

      // 检查模型是否支持视觉功能
      if (modelConfig.capabilities) {
        const hasVisionSupport = modelConfig.capabilities.some(
          cap =>
            cap === '图片理解' ||
            cap === '视频理解' ||
            cap === 'vision' ||
            cap.includes('image') ||
            cap.includes('video')
        );
        if (hasVisionSupport) {
          capabilities.push('vision');
        }

        // 检查模型是否支持思考模式
        const hasThinkingSupport = modelConfig.capabilities.some(
          cap =>
            cap === '思考模式' ||
            cap === '深度思考' ||
            cap === 'thinking' ||
            cap === 'reasoning' ||
            cap.includes('思考') ||
            cap.includes('推理')
        );
        if (hasThinkingSupport) {
          capabilities.push('thinking');
        }
      }

      return {
        license: '',
        modelfile: `# ${modelConfig.name}\nFROM ${modelConfig.name}`,
        parameters: `temperature 0.7\ntop_p 0.9\nnum_predict 1000`,
        template: '{{ .Prompt }}',
        system: '',
        details: {
          parent_model: '',
          format: 'gguf',
          family: this.getModelFamilyFromConfig(modelConfig),
          families: [this.getModelFamilyFromConfig(modelConfig)],
          parameter_size: this.getParameterSizeFromConfig(modelConfig).toString(),
          quantization_level: 'Q4_0',
        },
        model_info: {
          'general.architecture': this.getModelFamilyFromConfig(modelConfig),
          'general.parameter_count': this.getParameterSizeFromConfig(modelConfig),
          'general.quantization_version': 2,
        },
        projector_info: {},
        tensors: [],
        capabilities,
        modified_at: this.getFormattedTimestamp(),
      };
    } catch (error) {
      logger.error('显示Ollama格式模型信息失败', { model, error });
      if (error instanceof OllamaError) {
        throw error;
      }
      throw new OllamaError(`显示模型信息失败: ${error}`, 500);
    }
  }

  /**
   * 创建模型（模拟 - 暂不支持）
   */
  async createModel(model: string, modelfile: string): Promise<void> {
    logger.info('创建模型请求（模拟）', { model });
    throw new OllamaError('暂不支持创建模型功能', 501);
  }

  /**
   * 复制模型（模拟 - 暂不支持）
   */
  async copyModel(source: string, destination: string): Promise<void> {
    logger.info('复制模型请求（模拟）', { source, destination });
    throw new OllamaError('暂不支持复制模型功能', 501);
  }

  /**
   * 删除模型（模拟 - 暂不支持）
   */
  async deleteModel(model: string): Promise<void> {
    logger.info('删除模型请求（模拟）', { model });
    throw new OllamaError('暂不支持删除模型功能', 501);
  }

  /**
   * 拉取模型（模拟 - 暂不支持）
   */
  async pullModel(model: string): Promise<void> {
    logger.info('拉取模型请求（模拟）', { model });
    throw new OllamaError('暂不支持拉取模型功能', 501);
  }

  /**
   * 推送模型（模拟 - 暂不支持）
   */
  async pushModel(model: string): Promise<void> {
    logger.info('推送模型请求（模拟）', { model });
    throw new OllamaError('暂不支持推送模型功能', 501);
  }

  /**
   * 模拟聊天响应 - 当没有有效API密钥时使用
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse | AsyncIterable<string>> {
    try {
      logger.info('使用模拟聊天响应', { model: request.model });

      const modelConfig = await this.modelDiscovery.getModelConfig(request.model);
      if (!modelConfig) {
        throw new OllamaError(`模型不存在: ${request.model}`, 404);
      }

      if (request.stream) {
        return this.simulateStreamChat(request, modelConfig);
      } else {
        return this.simulateNonStreamChat(request, modelConfig);
      }
    } catch (error) {
      logger.error('模拟聊天失败', { model: request.model, error });
      throw new OllamaError(`模拟聊天失败: ${error}`, 500);
    }
  }

  /**
   * 模拟生成响应 - 当没有有效API密钥时使用
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse | AsyncIterable<string>> {
    try {
      logger.info('使用模拟生成响应', { model: request.model });

      const modelConfig = await this.modelDiscovery.getModelConfig(request.model);
      if (!modelConfig) {
        throw new OllamaError(`模型不存在: ${request.model}`, 404);
      }

      if (request.stream) {
        return this.simulateStreamGenerate(request, modelConfig);
      } else {
        return this.simulateNonStreamGenerate(request, modelConfig);
      }
    } catch (error) {
      logger.error('模拟生成失败', { model: request.model, error });
      throw new OllamaError(`模拟生成失败: ${error}`, 500);
    }
  }

  /**
   * 模拟非流式聊天响应
   */
  private simulateNonStreamChat(request: any, modelConfig: ModelConfig): any {
    const content = `这是来自 ${modelConfig.displayName} 的模拟响应。您说："${request.messages[request.messages.length - 1]?.content}"。请注意，这是一个模拟响应，因为没有配置有效的API密钥。`;

    return {
      model: request.model,
      created_at: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: content,
      },
      done: true,
      total_duration: 1000000000,
      load_duration: 500000000,
      prompt_eval_count: 10,
      prompt_eval_duration: 200000000,
      eval_count: 50,
      eval_duration: 300000000,
    };
  }

  /**
   * 模拟流式聊天响应
   */
  private async *simulateStreamChat(request: any, modelConfig: ModelConfig): AsyncGenerator<string, void, unknown> {
    const content = `这是来自 ${modelConfig.displayName} 的模拟流式响应。您说："${request.messages[request.messages.length - 1]?.content}"。请注意，这是一个模拟响应，因为没有配置有效的API密钥。`;

    const words = content.split('');

    for (let i = 0; i < words.length; i++) {
      const chunk = {
        model: request.model,
        created_at: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: words[i],
        },
        done: false,
      };

      yield JSON.stringify(chunk) + '\n';

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 最后的完成chunk
    const finalChunk = {
      model: request.model,
      created_at: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: '',
      },
      done: true,
      total_duration: 1000000000,
      load_duration: 500000000,
      prompt_eval_count: 10,
      prompt_eval_duration: 200000000,
      eval_count: content.length,
      eval_duration: content.length * 50000000,
    };

    yield JSON.stringify(finalChunk) + '\n';
  }

  /**
   * 模拟非流式生成响应
   */
  private simulateNonStreamGenerate(request: OllamaGenerateRequest, modelConfig: ModelConfig): OllamaGenerateResponse {
    const content = `这是来自 ${modelConfig.displayName} 的模拟生成响应。您说："${request.prompt}"。请注意，这是一个模拟响应，因为没有配置有效的API密钥。`;

    return {
      model: request.model,
      created_at: new Date().toISOString(),
      response: content,
      done: true,
      context: [],
      total_duration: 1000000000,
      load_duration: 500000000,
      prompt_eval_count: request.prompt.length / 4, // 估算token数
      prompt_eval_duration: 200000000,
      eval_count: content.length / 4, // 估算token数
      eval_duration: 300000000,
    };
  }

  /**
   * 模拟流式生成响应
   */
  private async *simulateStreamGenerate(
    request: OllamaGenerateRequest,
    modelConfig: ModelConfig
  ): AsyncGenerator<string, void, unknown> {
    const content = `这是来自 ${modelConfig.displayName} 的模拟流式生成响应。您说："${request.prompt}"。请注意，这是一个模拟响应，因为没有配置有效的API密钥。`;

    const words = content.split('');

    for (let i = 0; i < words.length; i++) {
      const chunk = {
        model: request.model,
        created_at: new Date().toISOString(),
        response: words[i],
        done: false,
      };

      yield JSON.stringify(chunk) + '\n';

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 最后的完成chunk
    const finalChunk = {
      model: request.model,
      created_at: new Date().toISOString(),
      response: '',
      done: true,
      context: [],
      total_duration: 1000000000,
      load_duration: 500000000,
      prompt_eval_count: request.prompt.length / 4,
      prompt_eval_duration: 200000000,
      eval_count: content.length,
      eval_duration: content.length * 50000000,
    };

    yield JSON.stringify(finalChunk) + '\n';
  }

  /**
   * 生成模型ID（直接使用原始模型名称，不添加前缀）
   * 保留此方法以保持兼容性，但现在只是返回原始名称
   */
  private generateModelId(modelConfig: ModelConfig): string {
    return modelConfig.name;
  }

  /**
   * 从模型ID解析出实际模型名称（现在已经不需要解析前缀）
   */
  private parseModelName(modelId: string): string {
    // 由于不再使用前缀，直接返回模型ID
    return modelId;
  }

  /**
   * 获取格式化的时间戳
   */
  private getFormattedTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * 生成模型摘要
   */
  private generateModelDigest(modelName: string): string {
    return crypto.createHash('sha256').update(modelName).digest('hex').substring(0, 12);
  }

  /**
   * 从配置获取模型大小
   */
  private getModelSizeFromConfig(config: ModelConfig): number {
    const parameterSize = this.getParameterSizeFromConfig(config);
    // 估算模型大小 (参数数量 * 2 bytes per parameter for FP16)
    return parameterSize * 2 * 1024 * 1024; // 转换为字节
  }

  /**
   * 从配置获取模型家族
   */
  private getModelFamilyFromConfig(config: ModelConfig): string {
    const modelName = config.name.toLowerCase();
    if (modelName.includes('doubao') || modelName.includes('豆包')) {
      return 'doubao';
    } else if (modelName.includes('qwen')) {
      return 'qwen';
    } else if (modelName.includes('llama')) {
      return 'llama';
    }
    return 'unknown';
  }

  /**
   * 从配置获取参数大小
   */
  private getParameterSizeFromConfig(config: ModelConfig): number {
    const modelName = config.name.toLowerCase();

    // 根据模型名称推断参数大小（单位：百万参数）
    if (modelName.includes('4k') || modelName.includes('32k') || modelName.includes('128k')) {
      if (modelName.includes('doubao-pro')) {
        return 175000; // 175B parameters
      } else if (modelName.includes('doubao-lite')) {
        return 7000; // 7B parameters
      }
    }

    if (modelName.includes('qwen-max')) {
      return 72000; // 72B parameters
    } else if (modelName.includes('qwen-plus')) {
      return 14000; // 14B parameters
    } else if (modelName.includes('qwen-turbo')) {
      return 7000; // 7B parameters
    } else if (modelName.includes('qwen-long')) {
      return 14000; // 14B parameters
    }

    // 默认值
    return 7000;
  }
}

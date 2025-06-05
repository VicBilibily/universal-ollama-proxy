import crypto from 'crypto';
import { ModelConfig, OllamaListResponse, OllamaModel, OllamaShowResponse } from '../types';
import { logger, OllamaError } from '../utils';
import { ModelDiscoveryService } from './modelDiscovery';

/**
 * Ollama 服务类
 * 提供实际使用的 Ollama API 功能：模型列表和模型信息显示
 */
export class OllamaService {
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
          // 使用组合键格式（provider:modelName）作为模型ID
          const modelId = modelName; // modelName 已经是 provider:modelName 格式

          models.push({
            name: modelConfig.name || modelId,
            model: modelId,
            size: this.getModelSizeFromConfig(modelConfig),
            digest: this.generateModelDigest(modelName),
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
        const hasVisionSupport = modelConfig.capabilities.supports.vision || false;
        if (hasVisionSupport) {
          capabilities.push('vision');
        }

        // 检查模型是否支持思考模式
        const hasThinkingSupport = modelConfig.capabilities.supports.thinking || false;
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
    // 优先使用配置文件中的 family 信息
    if (config.capabilities?.family) {
      return config.capabilities.family;
    }

    // 后备方案：从模型名称推断
    const modelName = config.name.toLowerCase();
    if (modelName.includes('doubao')) {
      return 'doubao';
    } else if (modelName.includes('qwen')) {
      return 'qwen';
    } else if (modelName.includes('llama')) {
      return 'llama';
    } else if (modelName.includes('deepseek')) {
      return 'deepseek';
    }
    return 'unknown';
  }

  /**
   * 从配置获取参数大小
   */
  private getParameterSizeFromConfig(config: ModelConfig): number {
    // 尝试从配置文件的 vendor 或其他字段获取参数信息
    // 这是一个简化的推断逻辑，实际参数大小应该在配置文件中明确定义
    const modelName = config.name.toLowerCase();
    const modelId = config.id.toLowerCase();

    // DeepSeek 模型
    if (modelId.includes('deepseek')) {
      if (modelId.includes('reasoner')) {
        return 671000; // 671B parameters
      } else if (modelId.includes('chat')) {
        return 67000; // 67B parameters
      }
    }

    // 豆包模型
    if (modelName.includes('doubao')) {
      if (modelName.includes('pro')) {
        return 175000; // 175B parameters
      } else if (modelName.includes('lite')) {
        return 7000; // 7B parameters
      }
    }

    // Qwen 模型
    if (modelName.includes('qwen')) {
      if (modelName.includes('max')) {
        return 72000; // 72B parameters
      } else if (modelName.includes('plus')) {
        return 14000; // 14B parameters
      } else if (modelName.includes('turbo') || modelName.includes('long')) {
        return 7000; // 7B parameters
      }
    }

    // 默认值
    return 7000;
  }
}

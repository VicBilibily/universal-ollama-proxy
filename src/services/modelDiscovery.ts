import * as fs from 'fs';
import * as path from 'path';
import {
  ModelDiscoveryService as IModelDiscoveryService,
  ModelConfig,
  ModelQueryOptions,
  ModelStats,
  VolcEngineModelsConfig,
} from '../types';
import { logger } from '../utils';

/**
 * 统一的模型发现服务
 * 直接从配置文件读取模型信息，不依赖具体的服务实现
 */
export class ModelDiscoveryService implements IModelDiscoveryService {
  private models: Map<string, ModelConfig> = new Map();
  private modelsByCategory: Map<string, ModelConfig[]> = new Map();
  private lastRefreshTime: Date = new Date(0);
  private readonly configDir: string;

  constructor() {
    this.configDir = path.join(process.cwd(), 'config');
    this.initializeModels();
  }

  /**
   * 初始化模型配置
   */
  private async initializeModels(): Promise<void> {
    try {
      await this.loadAllProviderModels();
      logger.info(`模型发现服务初始化完成，共加载 ${this.models.size} 个模型`);
    } catch (error) {
      logger.error('模型发现服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载所有提供商的模型配置
   */
  private async loadAllProviderModels(): Promise<void> {
    const providers = ['volcengine', 'dashscope', 'tencentds', 'deepseek'];

    for (const provider of providers) {
      try {
        await this.loadProviderModels(provider);
      } catch (error) {
        logger.warn(`加载 ${provider} 模型配置失败:`, error);
        // 继续加载其他提供商的模型
      }
    }

    this.lastRefreshTime = new Date();
  }

  /**
   * 加载指定提供商的模型配置
   */
  private async loadProviderModels(provider: string): Promise<void> {
    const configFile = path.join(this.configDir, `${provider}-models.json`);

    if (!fs.existsSync(configFile)) {
      logger.warn(`配置文件不存在: ${configFile}`);
      return;
    }

    try {
      const configContent = fs.readFileSync(configFile, 'utf-8');
      const config = JSON.parse(configContent) as VolcEngineModelsConfig;

      // 遍历所有分类的模型
      for (const [categoryKey, categoryData] of Object.entries(config.models)) {
        const categoryModels: ModelConfig[] = [];

        for (const [modelKey, modelConfig] of Object.entries(categoryData.models)) {
          // 为模型配置添加提供商信息
          const enrichedModel: ModelConfig = {
            ...modelConfig,
            provider: provider as any,
            category: categoryData.category,
          };

          this.models.set(modelConfig.name, enrichedModel);
          categoryModels.push(enrichedModel);
        }

        // 按分类存储模型
        const existingCategoryModels = this.modelsByCategory.get(categoryData.category) || [];
        this.modelsByCategory.set(categoryData.category, [...existingCategoryModels, ...categoryModels]);
      }

      logger.info(`成功加载 ${provider} 提供商的模型配置`);
    } catch (error) {
      logger.error(`解析 ${provider} 模型配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取所有可用模型名称
   */
  async getAvailableModels(): Promise<string[]> {
    return Array.from(this.models.keys());
  }

  /**
   * 获取指定模型的配置
   */
  async getModelConfig(modelName: string): Promise<ModelConfig | null> {
    return this.models.get(modelName) || null;
  }

  /**
   * 根据分类获取模型
   */
  async getModelsByCategory(category: string): Promise<ModelConfig[]> {
    return this.modelsByCategory.get(category) || [];
  }

  /**
   * 获取推荐模型
   */
  async getRecommendedModels(): Promise<ModelConfig[]> {
    return Array.from(this.models.values()).filter(model => model.recommended);
  }

  /**
   * 检查模型是否支持
   */
  async isModelSupported(modelName: string): Promise<boolean> {
    return this.models.has(modelName);
  }

  /**
   * 刷新模型配置
   */
  async refreshModels(): Promise<void> {
    logger.info('开始刷新模型配置...');
    this.models.clear();
    this.modelsByCategory.clear();
    await this.loadAllProviderModels();
    logger.info('模型配置刷新完成');
  }

  /**
   * 获取模型统计信息
   */
  async getModelStats(): Promise<ModelStats> {
    const allModels = Array.from(this.models.values());

    const modelsByCategory: Record<string, number> = {};
    const modelsByType: Record<string, number> = {};

    for (const model of allModels) {
      // 按分类统计
      if (model.category) {
        modelsByCategory[model.category] = (modelsByCategory[model.category] || 0) + 1;
      }

      // 按类型统计
      modelsByType[model.type] = (modelsByType[model.type] || 0) + 1;
    }

    return {
      totalModels: allModels.length,
      modelsByCategory,
      modelsByType,
      recommendedCount: allModels.filter(model => model.recommended).length,
    };
  }

  /**
   * 根据查询选项获取模型
   */
  async queryModels(options: ModelQueryOptions): Promise<ModelConfig[]> {
    let filteredModels = Array.from(this.models.values());

    if (options.category) {
      filteredModels = filteredModels.filter(model => model.category === options.category);
    }

    if (options.type) {
      filteredModels = filteredModels.filter(model => model.type === options.type);
    }

    if (options.recommended !== undefined) {
      filteredModels = filteredModels.filter(model => model.recommended === options.recommended);
    }

    if (options.supportedFormat) {
      filteredModels = filteredModels.filter(model => model.supportedFormats.includes(options.supportedFormat!));
    }

    if (options.minContextLength) {
      filteredModels = filteredModels.filter(model => model.contextLength >= options.minContextLength!);
    }

    if (options.maxContextLength) {
      filteredModels = filteredModels.filter(model => model.contextLength <= options.maxContextLength!);
    }

    return filteredModels;
  }

  /**
   * 获取指定提供商的所有模型
   */
  async getModelsByProvider(provider: string): Promise<ModelConfig[]> {
    return Array.from(this.models.values()).filter(model => model.provider === provider);
  }

  /**
   * 获取所有分类
   */
  async getAvailableCategories(): Promise<string[]> {
    return Array.from(this.modelsByCategory.keys());
  }

  /**
   * 获取最后刷新时间
   */
  getLastRefreshTime(): Date {
    return this.lastRefreshTime;
  }

  /**
   * 验证模型配置的完整性
   */
  async validateModelConfig(modelName: string): Promise<boolean> {
    const model = this.models.get(modelName);
    if (!model) {
      return false;
    }

    // 检查必需的字段
    const requiredFields = ['name', 'displayName', 'type', 'capabilities', 'contextLength'];
    for (const field of requiredFields) {
      if (!(field in model) || (model as any)[field] === undefined) {
        logger.warn(`模型 ${modelName} 缺少必需字段: ${field}`);
        return false;
      }
    }

    // 检查数值字段的有效性
    if (model.contextLength <= 0 || model.inputLength <= 0) {
      logger.warn(`模型 ${modelName} 的长度配置无效`);
      return false;
    }

    return true;
  }

  /**
   * 获取模型的完整信息（包含默认参数等）
   */
  async getModelFullInfo(modelName: string): Promise<any> {
    const model = await this.getModelConfig(modelName);
    if (!model) {
      return null;
    }

    // 尝试从对应的提供商配置文件获取默认参数
    const provider = model.provider;
    if (provider) {
      try {
        const configFile = path.join(this.configDir, `${provider}-models.json`);
        const configContent = fs.readFileSync(configFile, 'utf-8');
        const config = JSON.parse(configContent) as VolcEngineModelsConfig;

        return {
          ...model,
          defaultParameters: config.defaultParameters,
          endpoints: config.endpoints,
          meta: config.meta,
        };
      } catch (error) {
        logger.warn(`获取 ${provider} 提供商的默认参数失败:`, error);
      }
    }

    return model;
  }
}

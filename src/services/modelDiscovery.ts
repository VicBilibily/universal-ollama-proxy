import * as fs from 'fs';
import * as path from 'path';
import { ProviderConfig } from '../config/models';
import {
  ModelDiscoveryService as IModelDiscoveryService,
  ModelConfig,
  UnifiedAdapterConfig,
} from '../types';
import { logger } from '../utils';

/**
 * 统一的模型发现服务
 * 直接从配置文件读取模型信息，不依赖具体的服务实现
 * 只保留实际使用的方法：getAvailableModels 和 getModelConfig
 */
export class ModelDiscoveryService implements IModelDiscoveryService {
  private models: Map<string, ModelConfig> = new Map(); // 使用 provider:modelName 作为键
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
    // 从配置文件读取供应商列表
    const unifiedConfigPath = path.join(this.configDir, 'unified-providers.json');

    if (!fs.existsSync(unifiedConfigPath)) {
      throw new Error(`供应商配置文件不存在: ${unifiedConfigPath}`);
    }

    let unifiedConfig: UnifiedAdapterConfig;
    try {
      const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf-8');
      unifiedConfig = JSON.parse(unifiedConfigContent);
    } catch (error) {
      throw new Error(`读取或解析供应商配置文件失败: ${unifiedConfigPath}, 错误: ${error}`);
    }

    if (!unifiedConfig.providers || !Array.isArray(unifiedConfig.providers)) {
      throw new Error(`供应商配置文件格式错误: providers 字段缺失或格式不正确`);
    }

    const providers = unifiedConfig.providers.map(provider => provider.name);

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
      const config = JSON.parse(configContent) as ProviderConfig;

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

          // 使用 provider:modelName 作为唯一键
          const uniqueKey = `${provider}:${modelConfig.name}`;
          this.models.set(uniqueKey, enrichedModel);

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
   * 生成完整的模型键
   */
  private generateModelKey(provider: string, modelName: string): string {
    return `${provider}:${modelName}`;
  }

  /**
   * 解析模型键
   */
  private parseModelKey(key: string): { provider: string; modelName: string } | null {
    const parts = key.split(':');
    if (parts.length === 2) {
      return { provider: parts[0], modelName: parts[1] };
    }
    return null;
  }

  /**
   * 获取所有可用模型名称（强制使用组合键格式）
   */
  async getAvailableModels(): Promise<string[]> {
    // 直接返回所有组合键格式的模型名称
    return Array.from(this.models.keys()).sort();
  }

  /**
   * 获取指定模型的配置（只接受 provider:modelName 格式）
   */
  async getModelConfig(modelName: string): Promise<ModelConfig | null> {
    // 只接受完整的 provider:modelName 格式
    return this.models.get(modelName) || null;
  }
}

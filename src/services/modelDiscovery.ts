import * as fs from 'fs';
import * as path from 'path';
import {
  ModelDiscoveryService as IModelDiscoveryService,
  ModelConfig,
  ProviderConfig,
  UnifiedAdapterConfig,
} from '../types';
import { logger } from '../utils';
import { parseConfigFile } from '../utils/jsonParser';

/**
 * 统一的模型发现服务
 * 支持新的 GitHub Copilot 兼容模型配置格式
 */
export class ModelDiscoveryService implements IModelDiscoveryService {
  private models: Map<string, ModelConfig> = new Map(); // 使用 provider:modelName 作为键
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
      unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);
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
      const config = parseConfigFile(configContent, configFile) as ProviderConfig;

      // 验证配置文件格式
      if (!config.models || !Array.isArray(config.models)) {
        throw new Error(`配置文件格式错误: ${configFile} - 缺少 models 数组字段`);
      }

      // 加载所有模型
      for (const modelConfig of config.models) {
        // 使用 provider:modelId 作为唯一键
        const uniqueKey = `${provider}:${modelConfig.id}`;
        this.models.set(uniqueKey, modelConfig);
      }

      logger.info(`成功加载 ${provider} 提供商的 ${config.models.length} 个模型`);
    } catch (error) {
      logger.error(`解析 ${provider} 模型配置失败:`, error);
      throw error;
    }
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

  /**
   * 刷新模型配置
   */
  async refreshModels(): Promise<void> {
    this.models.clear();
    await this.loadAllProviderModels();
  }
}

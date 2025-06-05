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

  /**
   * 重新加载指定提供商的模型配置
   */
  async refreshProviderModels(providerName: string): Promise<void> {
    try {
      // 移除该提供商的所有模型
      const keysToDelete = Array.from(this.models.keys()).filter(key => key.startsWith(`${providerName}:`));
      keysToDelete.forEach(key => this.models.delete(key));

      // 重新加载该提供商的模型
      await this.loadProviderModels(providerName);

      logger.info(`已重新加载 ${providerName} 提供商的模型配置`);
    } catch (error) {
      logger.error(`重新加载 ${providerName} 提供商模型配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取当前加载的提供商列表
   */
  getLoadedProviders(): string[] {
    const providers = new Set<string>();
    for (const modelKey of this.models.keys()) {
      if (modelKey.includes(':')) {
        providers.add(modelKey.split(':')[0]);
      }
    }
    return Array.from(providers).sort();
  }

  /**
   * 获取模型统计信息
   */
  getModelStats(): { totalModels: number; providerCount: number; lastRefresh: Date } {
    return {
      totalModels: this.models.size,
      providerCount: this.getLoadedProviders().length,
      lastRefresh: this.lastRefreshTime,
    };
  }

  /**
   * 同步供应商配置 - 移除不再存在的供应商的模型，并重新加载现有供应商的模型
   */
  async syncWithProviderConfig(availableProviders: string[]): Promise<void> {
    try {
      logger.info('开始同步模型发现服务与供应商配置');

      // 获取当前已加载的供应商
      const currentProviders = this.getLoadedProviders();

      // 找出需要移除的供应商（存在于当前已加载但不在新配置中）
      const providersToRemove = currentProviders.filter(provider => !availableProviders.includes(provider));

      // 找出需要重新加载的供应商（存在于新配置中）
      const providersToReload = availableProviders;

      // 移除不再存在的供应商的所有模型
      for (const providerToRemove of providersToRemove) {
        const keysToDelete = Array.from(this.models.keys()).filter(key => key.startsWith(`${providerToRemove}:`));
        keysToDelete.forEach(key => this.models.delete(key));
        logger.info(`已移除 ${providerToRemove} 提供商的 ${keysToDelete.length} 个模型`);
      }

      // 重新加载所有当前供应商的模型（包括新增和已存在的）
      for (const provider of providersToReload) {
        try {
          // 先移除该提供商的现有模型，再重新加载
          const keysToDelete = Array.from(this.models.keys()).filter(key => key.startsWith(`${provider}:`));
          keysToDelete.forEach(key => this.models.delete(key));

          // 重新加载该提供商的模型
          await this.loadProviderModels(provider);
        } catch (error) {
          logger.warn(`重新加载 ${provider} 模型配置失败:`, error);
          // 继续处理其他提供商
        }
      }

      this.lastRefreshTime = new Date();

      const stats = this.getModelStats();
      logger.info('模型发现服务与供应商配置同步完成', {
        removedProviders: providersToRemove,
        reloadedProviders: providersToReload,
        totalModels: stats.totalModels,
        activeProviders: stats.providerCount,
      });
    } catch (error) {
      logger.error('同步模型发现服务与供应商配置失败:', error);
      throw error;
    }
  }
}

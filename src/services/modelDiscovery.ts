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
  private availableProviders: Set<string> = new Set(); // 跟踪可用的提供商

  constructor() {
    this.configDir = path.join(process.cwd(), 'config');
    // 不在构造函数中初始化，而是提供一个显式的初始化方法
  }

  /**
   * 初始化模型配置（需要显式调用）
   */
  async initialize(): Promise<void> {
    try {
      await this.loadAllProviderModels();
      const size = this.models.size;
      logger.info(`模型发现服务初始化完成，共加载 ${size} 个模型`);
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
        const providerName = provider;
        logger.warn(`加载 ${providerName} 模型配置失败:`, error);
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
      const filePath = configFile;
      logger.warn(`配置文件不存在: ${filePath}`);
      return;
    }

    try {
      const configContent = fs.readFileSync(configFile, 'utf-8');
      const config = parseConfigFile(configContent, configFile) as ProviderConfig;

      // 验证配置文件格式
      if (!config.models || !Array.isArray(config.models)) {
        throw new Error(`配置文件格式错误: ${configFile} - 缺少 models 数组字段`);
      }

      // 只加载启用的模型（model_picker_enabled: true）
      let enabledCount = 0;
      for (const modelConfig of config.models) {
        // 只加载 model_picker_enabled 为 true 的模型
        if (modelConfig.model_picker_enabled === true) {
          // 使用 provider:modelId 作为唯一键
          const uniqueKey = `${provider}:${modelConfig.id}`;
          this.models.set(uniqueKey, modelConfig);
          enabledCount++;
        }
      }

      const totalCount = config.models.length;
      logger.info(`成功加载 ${provider} 提供商的 ${enabledCount} 个启用模型（总共 ${totalCount} 个模型）`);
    } catch (error) {
      const providerName = provider;
      logger.error(`解析 ${providerName} 模型配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取所有可用模型名称（强制使用组合键格式）
   * 只返回来自可用提供商的模型
   */
  async getAvailableModels(): Promise<string[]> {
    // 如果没有设置可用提供商列表（即未限制任何提供商），则返回所有模型
    if (this.availableProviders.size === 0) {
      return Array.from(this.models.keys()).sort();
    }

    // 否则，只返回来自可用提供商的模型
    return Array.from(this.models.keys())
      .filter(key => {
        const providerName = key.split(':')[0];
        return this.availableProviders.has(providerName);
      })
      .sort();
  }

  /**
   * 获取指定模型的配置（只接受 provider:modelName 格式）
   * 如果提供商不可用，则返回null
   */
  async getModelConfig(modelName: string): Promise<ModelConfig | null> {
    // 检查提供商是否可用
    if (this.availableProviders.size > 0) {
      const providerName = modelName.split(':')[0];
      if (!this.availableProviders.has(providerName)) {
        const model = modelName;
        const provider = providerName;
        logger.debug(`模型 ${model} 所属的提供商 ${provider} 不可用`);
        return null;
      }
    }

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
   * 更新可用提供商列表
   * 这将影响模型的可见性 - 只有来自可用提供商的模型才会被返回
   */
  updateAvailableProviders(providers: string[]): void {
    this.availableProviders.clear();
    providers.forEach(provider => this.availableProviders.add(provider));
    const providerList = Array.from(this.availableProviders);
    const count = this.availableProviders.size;
    const providerListText = providerList.join(', ');
    logger.info(`已更新可用提供商列表: ${providerListText}，数量: ${count}`);
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

      const provider = providerName;
      logger.info(`已重新加载 ${provider} 提供商的模型配置`);
    } catch (error) {
      const provider = providerName;
      logger.error(`重新加载 ${provider} 提供商模型配置失败:`, error);
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
  getModelStats(): { totalModels: number; providerCount: number; availableProviders: number; lastRefresh: Date } {
    return {
      totalModels: this.models.size,
      providerCount: this.getLoadedProviders().length,
      availableProviders: this.availableProviders.size,
      lastRefresh: this.lastRefreshTime,
    };
  }

  /**
   * 获取当前可用的提供商列表
   */
  getAvailableProviders(): string[] {
    return Array.from(this.availableProviders).sort();
  }

  /**
   * 获取按供应商分组的模型信息
   * 只返回可用提供商的模型
   */
  getModelsByProvider(): Record<string, { count: number; models: string[] }> {
    const modelsByProvider: Record<string, { count: number; models: string[] }> = {};

    for (const modelKey of this.models.keys()) {
      const providerName = modelKey.split(':')[0];

      // 只包含可用提供商的模型
      if (this.availableProviders.size > 0 && !this.availableProviders.has(providerName)) {
        continue;
      }

      if (!modelsByProvider[providerName]) {
        modelsByProvider[providerName] = {
          count: 0,
          models: [],
        };
      }

      modelsByProvider[providerName].count++;
      modelsByProvider[providerName].models.push(modelKey);
    }

    // 对每个提供商的模型列表进行排序
    for (const provider in modelsByProvider) {
      modelsByProvider[provider].models.sort();
    }

    return modelsByProvider;
  }

  /**
   * 输出按供应商分组的模型注册信息
   */
  logModelsByProvider(): void {
    const modelsByProvider = this.getModelsByProvider();
    const totalProviders = Object.keys(modelsByProvider).length;
    const totalModels = Object.values(modelsByProvider).reduce((sum, provider) => sum + provider.count, 0);

    if (totalProviders === 0) {
      logger.info('当前没有可用的模型提供商');
      return;
    }

    const providerCount = totalProviders;
    const modelCount = totalModels;
    logger.info(`已注册的模型总览: ${providerCount} 个提供商，共 ${modelCount} 个模型`);

    // 按提供商名称排序输出
    const sortedProviders = Object.keys(modelsByProvider).sort();

    for (const provider of sortedProviders) {
      const providerInfo = modelsByProvider[provider];
      const providerName = provider;
      const count = providerInfo.count;
      logger.info(`[${providerName}] ${count} 个模型:`);

      // 将模型分组输出，每行最多显示5个模型
      const modelsPerLine = 5;
      for (let i = 0; i < providerInfo.models.length; i += modelsPerLine) {
        const modelGroup = providerInfo.models.slice(i, i + modelsPerLine);
        const modelNames = modelGroup
          .map(model => {
            // 使用第一个冒号进行分割，允许模型名称中包含更多冒号
            const colonIndex = model.indexOf(':');
            return colonIndex !== -1 ? model.substring(colonIndex + 1) : model;
          })
          .join(', ');
        const names = modelNames;
        logger.info(`  ${names}`);
      }
    }
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
        const provider = providerToRemove;
        const count = keysToDelete.length;
        logger.info(`已移除 ${provider} 提供商的 ${count} 个模型`);
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
          const providerName = provider;
          logger.warn(`重新加载 ${providerName} 模型配置失败:`, error);
          // 继续处理其他提供商
        }
      }

      this.lastRefreshTime = new Date();

      const stats = this.getModelStats();
      const removedProviders = providersToRemove.join(', ');
      const reloadedProviders = providersToReload.join(', ');
      const totalModels = stats.totalModels;
      const providerCount = stats.providerCount;
      logger.info(
        `模型发现服务与供应商配置同步完成，删除的提供商: ${removedProviders}，重载的提供商: ${reloadedProviders}，总模型数: ${totalModels}，活跃提供商: ${providerCount}`
      );
    } catch (error) {
      logger.error('同步模型发现服务与供应商配置失败:', error);
      throw error;
    }
  }
}

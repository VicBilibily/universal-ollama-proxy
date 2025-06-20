import * as fsPromises from 'fs/promises';
import path from 'path';
import { configManager } from '../config';
import { UnifiedAdapterConfig } from '../types';
import { logger } from '../utils';
import { chatLogger } from '../utils/chatLogger';
import { parseConfigFile } from '../utils/jsonParser';
import { configHotReload } from './configHotReload';
import { ModelDiscoveryService } from './modelDiscovery';
import { UnifiedAdapterService } from './unifiedAdapter';

/**
 * 配置重载处理类 - 负责处理配置文件变更的重载逻辑
 */
export class ConfigReloader {
  private modelDiscoveryService?: ModelDiscoveryService;
  private unifiedAdapterService?: UnifiedAdapterService;

  /**
   * 初始化配置重载处理器
   * @param modelDiscoveryService 模型发现服务实例
   * @param unifiedAdapterService 统一适配器服务实例
   */
  constructor(modelDiscoveryService?: ModelDiscoveryService, unifiedAdapterService?: UnifiedAdapterService) {
    this.modelDiscoveryService = modelDiscoveryService;
    this.unifiedAdapterService = unifiedAdapterService;
  }

  /**
   * 设置服务实例（用于后期更新）
   */
  public setServices(modelDiscoveryService: ModelDiscoveryService, unifiedAdapterService: UnifiedAdapterService): void {
    this.modelDiscoveryService = modelDiscoveryService;
    this.unifiedAdapterService = unifiedAdapterService;
  }

  /**
   * 初始化配置热重载
   */
  public initializeConfigHotReload(): void {
    // 启用配置热重载
    configHotReload.enable();

    // 监听配置变化事件
    configHotReload.on('configChanged', (event: any) => {
      const filePath = event.filePath;
      const type = event.type;
      const timestamp = event.timestamp;
      logger.info(`配置文件已更新: ${filePath}，类型: ${type}，时间戳: ${timestamp}`);

      // 根据配置类型执行相应的重载逻辑
      if (event.type === 'config') {
        this.handleJsonConfigChange(event.filePath);
      }
    });

    // 监听配置管理器的配置更新事件
    configManager.on('configUpdated', ({ key, oldValue, newValue }: any) => {
      const configKey = key;
      const oldVal = JSON.stringify(oldValue);
      const newVal = JSON.stringify(newValue);
      logger.info(`配置项已更新: ${configKey}，旧值: ${oldVal}，新值: ${newVal}`);
      this.handleConfigUpdate(key, oldValue, newValue);
    });

    // 监听配置重载事件
    configManager.on('configReloaded', () => {
      logger.info('所有配置已重新加载');
    });

    // 监听配置文件删除事件
    configHotReload.on('configDeleted', (event: any) => {
      const filePath = event.filePath;
      const type = event.type;
      const timestamp = event.timestamp;
      logger.info(`配置文件已删除: ${filePath}，类型: ${type}，时间戳: ${timestamp}`);

      // 根据配置类型执行相应的删除处理逻辑
      if (event.type === 'delete') {
        this.handleJsonConfigDelete(event.filePath);
      }
    });

    // 监听热重载错误
    configHotReload.on('error', (error: any) => {
      logger.error('配置热重载错误:', error);
    });

    logger.info('配置热重载服务已初始化（仅支持JSON配置文件）');
  }

  /**
   * 处理JSON配置文件变化
   */
  private handleJsonConfigChange(filePath: string): void {
    try {
      const fileName = path.basename(filePath, '.json');
      logger.info(`处理JSON配置文件变化: ${fileName}`);

      // 根据配置文件类型执行相应的处理逻辑
      switch (fileName) {
        case 'unified-providers':
          this.handleUnifiedProvidersConfigChange();
          break;
        case 'message-processing-rules':
          this.handleMessageProcessingRulesChange();
          break;
        default:
          // 检查是否是模型配置文件 (provider-models.json 格式)
          if (fileName.endsWith('-models')) {
            const providerName = fileName.replace('-models', '');
            this.handleProviderModelsConfigChange(providerName);
          } else {
            logger.debug(`未知的配置文件类型: ${fileName}`);
          }
      }
    } catch (error) {
      logger.error('处理JSON配置文件变化失败:', error);
    }
  }

  /**
   * 处理配置文件删除事件
   */
  private handleJsonConfigDelete(filePath: string): void {
    try {
      const fileName = path.basename(filePath, '.json');
      logger.info(`处理JSON配置文件删除: ${fileName}`);

      // 根据配置文件类型执行相应的处理逻辑
      switch (fileName) {
        case 'unified-providers':
          logger.warn('统一提供商配置文件已删除，需要手动重启服务以加载默认配置');
          break;
        case 'message-processing-rules':
          logger.info('消息处理规则配置文件已删除，将使用默认规则');
          break;
        default:
          // 检查是否是模型配置文件 (provider-models.json 格式)
          if (fileName.endsWith('-models')) {
            const providerName = fileName.replace('-models', '');
            logger.info(`${providerName} 提供商模型配置文件已删除，将使用默认配置`);
          } else {
            logger.debug(`未知的配置文件被删除: ${fileName}`);
          }
      }
    } catch (error) {
      logger.error('处理JSON配置文件删除失败:', error);
    }
  }

  /**
   * 处理配置项更新
   */
  private handleConfigUpdate(key: string, oldValue: any, newValue: any): void {
    try {
      // 处理特定配置项的更新
      switch (key) {
        case 'port':
          logger.warn(`端口配置已更改，需要重启服务才能生效，旧端口: ${oldValue}，新端口: ${newValue}`);
          break;
        default:
          const configKey = key;
          const oldVal = JSON.stringify(oldValue);
          const newVal = JSON.stringify(newValue);
          logger.debug(`配置项 ${configKey} 已更新，旧值: ${oldVal}，新值: ${newVal}`);
      }
    } catch (error) {
      logger.error('处理配置更新失败:', error);
    }
  }

  /**
   * 处理统一提供商配置变更
   */
  private async handleUnifiedProvidersConfigChange(): Promise<void> {
    try {
      logger.info('统一提供商配置已更改，重新初始化相关服务');

      // 重新加载统一提供商配置
      const unifiedConfigPath = path.join(process.cwd(), 'config', 'unified-providers.json');
      const unifiedConfigData = await fsPromises.readFile(unifiedConfigPath, 'utf-8');
      const unifiedConfig: UnifiedAdapterConfig = parseConfigFile(unifiedConfigData, unifiedConfigPath);

      // 替换环境变量并过滤可用的提供商
      const validProvidersForHotReload: UnifiedAdapterConfig['providers'] = [];

      for (const provider of unifiedConfig.providers) {
        let isProviderAvailable = false;

        // 情况1: 以${开头，表示从环境变量获取
        if (provider.apiKey && provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
          const envVar = provider.apiKey.slice(2, -1);
          const envValue = process.env[envVar];

          if (envValue && envValue.trim() !== '') {
            provider.apiKey = envValue;
            isProviderAvailable = true;
            const envVariable = envVar;
            const displayName = provider.displayName;
            logger.info(`从环境变量 ${envVariable} 获取 ${displayName} 提供商的 API Key`);
          } else {
            const envVariable = envVar;
            const displayName = provider.displayName;
            logger.warn(`环境变量 ${envVariable} 未设置，${displayName} 提供商将不可用`);
            isProviderAvailable = false;
          }
        }
        // 情况2: 不以${开头且非空，表示配置中已有配置密钥
        else if (provider.apiKey && provider.apiKey.trim() !== '') {
          const displayName = provider.displayName;
          logger.info(`使用配置文件中的配置密钥配置 ${displayName} 提供商`);
          isProviderAvailable = true;
        }
        // 情况3: 为空，表示此供应商不需要认证
        else if (!provider.apiKey || provider.apiKey.trim() === '') {
          const displayName = provider.displayName;
          logger.info(`${displayName} 提供商不需要认证，使用空 API Key`);
          provider.apiKey = '';
          isProviderAvailable = true;
        }

        // 只添加可用的提供商到配置中
        if (isProviderAvailable) {
          validProvidersForHotReload.push(provider);
        }
      }

      // 更新配置，只包含可用的提供商
      unifiedConfig.providers = validProvidersForHotReload;

      const availableProviders = validProvidersForHotReload.map((p: any) => p.displayName).join(', ');
      logger.info(`热重载过滤后可用的提供商: ${availableProviders}`);

      // 获取新配置中的供应商列表
      const configProviderNames = unifiedConfig.providers.map((provider: any) => provider.name);

      // 先更新模型发现服务，同步供应商配置（这会移除不存在的供应商的模型）
      if (this.modelDiscoveryService) {
        await this.modelDiscoveryService.syncWithProviderConfig(configProviderNames);
        logger.info('模型发现服务已与供应商配置同步');
      }

      // 再更新统一适配器服务配置
      if (this.unifiedAdapterService) {
        this.unifiedAdapterService.updateConfig(unifiedConfig);
        logger.info('统一适配器服务配置已更新');

        // 更新模型发现服务的可用提供商列表
        const activeProviders = this.unifiedAdapterService.getActiveProviders();
        if (this.modelDiscoveryService) {
          this.modelDiscoveryService.updateAvailableProviders(activeProviders);
          const providerList = activeProviders.join(', ');
          logger.info(`已更新模型发现服务的可用提供商列表: ${providerList}`);
        }
      }

      // 记录最终状态
      const modelStats = this.modelDiscoveryService?.getModelStats();
      const activeProviders = this.unifiedAdapterService?.getActiveProviders();

      const configProviderCount = configProviderNames.length;
      const activeProviderCount = activeProviders?.length || 0;
      const totalModels = modelStats?.totalModels || 0;
      const modelProviderCount = modelStats?.providerCount || 0;

      logger.info(
        `统一提供商配置变化处理完成，配置提供商: ${configProviderCount}，活跃提供商: ${activeProviderCount}，总模型数: ${totalModels}，模型提供商: ${modelProviderCount}`
      );

      // 输出按供应商分组的注册模型信息
      if (this.modelDiscoveryService) {
        logger.info('=== 配置热重载完成，输出可用模型信息 ===');
        this.modelDiscoveryService.logModelsByProvider();
      }
    } catch (error) {
      logger.error('处理统一提供商配置变化失败:', error);
    }
  }

  /**
   * 处理消息处理规则配置变更
   */
  private handleMessageProcessingRulesChange(): void {
    try {
      logger.info('消息处理规则配置已更改，重新加载日志配置');

      // 重新加载聊天日志配置
      if (chatLogger && typeof chatLogger.reloadConfig === 'function') {
        chatLogger.reloadConfig();
        const config = chatLogger.getConfig();
        logger.info(`聊天日志配置已重新加载，启用状态: ${chatLogger.isEnabled()}，配置: ${JSON.stringify(config)}`);
      }
    } catch (error) {
      logger.error('处理消息处理规则变化失败:', error);
    }
  }

  /**
   * 处理提供商模型配置变更
   */
  private async handleProviderModelsConfigChange(providerName: string): Promise<void> {
    try {
      logger.info(`${providerName} 提供商模型配置已更改，重新加载模型配置`);

      // 重新加载该提供商的模型配置
      if (this.modelDiscoveryService) {
        await this.modelDiscoveryService.refreshProviderModels(providerName);

        const stats = this.modelDiscoveryService.getModelStats();
        logger.info(`${providerName} 提供商模型配置重新加载完成`, stats);

        // 输出按供应商分组的注册模型信息
        logger.info(`=== ${providerName} 提供商配置更新完成，输出可用模型信息 ===`);
        this.modelDiscoveryService.logModelsByProvider();
      }
    } catch (error) {
      logger.error(`处理 ${providerName} 提供商模型配置变化失败:`, error);
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    try {
      // 停止配置热重载服务
      if (configHotReload) {
        configHotReload.destroy();
        logger.info('配置热重载服务已停止');
      }
    } catch (error) {
      logger.error('清理配置热重载服务资源失败:', error);
    }
  }
}

// 导出单例实例
export const configReloader = new ConfigReloader();

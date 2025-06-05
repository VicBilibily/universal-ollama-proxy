import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils';
import { parseConfigFile } from '../utils/jsonParser';

// 加载 .env 文件，但不覆盖系统环境变量
// 这样系统环境变量的优先级高于 .env 文件
dotenv.config({ override: false });

export interface AppConfig {
  port: number;
  // 日志配置
  logLevel: string;
  chatLogs: boolean;
  chatLogsDir: string;
  // 环境配置
  nodeEnv: string;
  // 动态 API Keys（从统一配置文件中读取）
  apiKeys: Record<string, string>;
  // 可以在这里添加更多配置项
  [key: string]: any;
}

// 配置管理类
class ConfigManager extends EventEmitter {
  private _config: AppConfig;
  private configFiles: Map<string, any> = new Map();

  constructor() {
    super();
    this._config = this.loadInitialConfig();
    this.loadConfigFiles();
  }

  private loadInitialConfig(): AppConfig {
    // 动态加载 API Keys
    const apiKeys: Record<string, string> = {};

    // 尝试从统一配置文件中读取所有供应商的 API Key 配置
    try {
      const unifiedConfigPath = path.join(process.cwd(), 'config', 'unified-providers.json');
      if (fs.existsSync(unifiedConfigPath)) {
        const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf8');
        const unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);

        // 从配置文件中提取所有 API Key 环境变量
        unifiedConfig.providers?.forEach((provider: any) => {
          if (provider.apiKey && provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
            const envVar = provider.apiKey.slice(2, -1);
            const apiKeyValue = process.env[envVar];
            if (apiKeyValue) {
              apiKeys[provider.name] = apiKeyValue;
            }
          }
        });
      }
    } catch (error) {
      logger.warn('无法读取统一配置文件:', error);
    }

    return {
      port: parseInt(process.env.PORT || '11434', 10),
      logLevel: process.env.LOG_LEVEL || 'info',
      chatLogs: process.env.CHAT_LOGS?.toLowerCase() === 'true' || false,
      chatLogsDir: process.env.CHAT_LOGS_DIR || 'logs/chat',
      nodeEnv: process.env.NODE_ENV || 'development',
      apiKeys,
    };
  }

  private loadConfigFiles(): void {
    const configDir = path.join(process.cwd(), 'config');

    if (!fs.existsSync(configDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(configDir);

      for (const file of files) {
        if (path.extname(file) === '.json') {
          const filePath = path.join(configDir, file);
          const configKey = path.basename(file, '.json');

          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const configData = parseConfigFile(fileContent, filePath);
            this.configFiles.set(configKey, configData);
            this._config[configKey] = configData;
          } catch (error) {
            logger.warn(`无法加载配置文件 ${file}:`, error);
          }
        }
      }
    } catch (error) {
      logger.warn('读取配置目录失败:', error);
    }
  }

  public get config(): AppConfig {
    return this._config;
  }

  public updateConfig(key: string, value: any): void {
    const oldValue = this._config[key];
    this._config[key] = value;

    this.emit('configUpdated', { key, oldValue, newValue: value });
  }

  public updateFromFile(configKey: string, configData: any): void {
    this.configFiles.set(configKey, configData);
    this.updateConfig(configKey, configData);
  }

  public reloadAll(): void {
    // 重新加载配置文件（不再支持环境变量热重载）
    this.loadConfigFiles();

    this.emit('configReloaded');
  }

  public validate(): void {
    // 基本配置验证
    if (isNaN(this._config.port) || this._config.port <= 0 || this._config.port > 65535) {
      throw new Error('端口号必须是1-65535之间的有效数字');
    }

    // 在这里可以添加更多的配置验证逻辑
  }

  public getConfigFile(key: string): any {
    return this.configFiles.get(key);
  }

  public getAllConfigFiles(): Map<string, any> {
    return new Map(this.configFiles);
  }
}

// 创建全局配置管理器实例
const configManager = new ConfigManager();

// 导出配置对象和管理器
export const config = configManager.config;
export const validateConfig = () => configManager.validate();

// 导出配置管理器，用于热重载功能
export { configManager };

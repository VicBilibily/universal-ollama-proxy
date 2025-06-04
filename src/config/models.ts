import fs from 'fs';
import path from 'path';

export interface ModelInfo {
  name: string;
  displayName: string;
  type: 'chat' | 'embedding';
  capabilities: string[];
  contextLength: number;
  inputLength: number;
  outputLength: number;
  defaultOutputLength: number;
  reasoningLength?: number;
  rateLimits: {
    rpm: number;
    tpm: number;
  };
  freeTokens: number;
  recommended: boolean;
  supportedFormats: string[];
}

export interface ModelCategory {
  category: string;
  description: string;
  models: Record<string, ModelInfo>;
}

export interface ProviderConfig {
  models: Record<string, ModelCategory>;
  defaultParameters: Record<string, any>;
  endpoints: Record<string, string>;
  authentication: {
    type: string;
    header: string;
    prefix: string;
  };
  baseUrl: string;
  meta: {
    version: string;
    lastUpdated: string;
    source: string;
    description: string;
  };
}

class ModelConfigLoader {
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config');
  }

  /**
   * 通用配置文件加载方法
   * @param provider 提供商名称
   */
  loadProviderConfig(provider: string): ProviderConfig {
    const configFile = path.join(this.configPath, `${provider}-models.json`);
    return this.loadJsonConfig(configFile);
  }

  /**
   * 获取所有支持的模型列表（从供应商配置文件中获取）
   */
  getAllSupportedModels(): string[] {
    const models: string[] = [];

    // 从配置文件读取供应商列表
    const unifiedConfigPath = path.join(this.configPath, 'unified-providers.json');

    if (!fs.existsSync(unifiedConfigPath)) {
      throw new Error(`供应商配置文件不存在: ${unifiedConfigPath}`);
    }

    let unifiedConfig;
    try {
      const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf-8');
      unifiedConfig = JSON.parse(unifiedConfigContent);
    } catch (error) {
      throw new Error(`读取或解析供应商配置文件失败: ${unifiedConfigPath}, 错误: ${error}`);
    }

    if (!unifiedConfig.providers || !Array.isArray(unifiedConfig.providers)) {
      throw new Error(`供应商配置文件格式错误: providers 字段缺失或格式不正确`);
    }

    const providers = unifiedConfig.providers.map((provider: any) => provider.name);

    for (const provider of providers) {
      try {
        const config = this.loadProviderConfig(provider);
        Object.values(config.models).forEach(category => {
          models.push(...Object.keys(category.models));
        });
      } catch (error) {
        console.warn(`Failed to load ${provider} models:`, error);
        // 继续加载其他提供商，但不使用后备列表
      }
    }

    return [...new Set(models)]; // 去重
  }

  private loadJsonConfig<T = any>(filePath: string): T {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load config file ${filePath}: ${error}`);
    }
  }
}

// 单例实例
export const modelConfigLoader = new ModelConfigLoader();

// 默认导出
export default modelConfigLoader;

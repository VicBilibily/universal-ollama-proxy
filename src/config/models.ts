import fs from 'fs';
import path from 'path';

export interface ModelInfo {
  name: string;
  displayName: string;
  type: string;
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
  pricing?: {
    input: number;
    output: number;
  };
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
   * 获取所有支持的模型列表（从统一配置中获取）
   */
  getAllSupportedModels(): string[] {
    const providers = ['volcengine', 'dashscope', 'tencentds', 'deepseek'];
    const models: string[] = [];

    for (const provider of providers) {
      try {
        const config = this.loadProviderConfig(provider);
        Object.values(config.models).forEach(category => {
          models.push(...Object.keys(category.models));
        });
      } catch (error) {
        // 忽略加载失败的提供商
        console.warn(`Failed to load ${provider} models:`, error);
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

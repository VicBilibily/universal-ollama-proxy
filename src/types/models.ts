// 模型配置和发现服务类型定义

export interface ModelConfig {
  name: string;
  displayName: string;
  description?: string;
  category?: string;
  type: 'chat' | 'embedding';
  capabilities: string[];
  contextLength: number;
  inputLength: number;
  outputLength?: number;
  defaultOutputLength?: number;
  reasoningLength?: number;
  outputDimension?: number;
  rateLimits: {
    rpm: number;
    tpm: number;
  };
  freeTokens: number;
  recommended: boolean;
  supportedFormats: string[];
  endpoint?: string; // 可选的自定义端点，默认使用name
  provider?: string; // 模型提供商
}

export interface ModelCategory {
  category: string;
  description: string;
  models: Record<string, ModelConfig>;
}

export interface DefaultParameters {
  chat: {
    temperature: number;
    top_p: number;
    max_tokens: number;
    stream: boolean;
    frequency_penalty: number;
    presence_penalty: number;
  };
  embedding: {
    encoding_format: string;
  };
}

// 模型发现服务接口
export interface ModelDiscoveryService {
  getAvailableModels(): Promise<string[]>;
  getModelConfig(modelName: string): Promise<ModelConfig | null>;
}

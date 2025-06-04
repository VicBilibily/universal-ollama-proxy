// 模型配置和发现服务类型定义

/**
 * 模型配置接口 - 基于 GitHub Copilot 模型列表格式
 */
export interface ModelConfig {
  id: string;
  name: string;
  object: 'model';
  vendor: string;
  version: string;
  preview: boolean;
  model_picker_enabled: boolean;
  capabilities: ModelCapabilities;
}

/**
 * 模型能力配置
 */
export interface ModelCapabilities {
  family: string;
  limits: ModelLimits;
  object: 'model_capabilities';
  supports: ModelSupports;
  tokenizer: string;
  type: 'chat';
}

/**
 * 模型限制配置
 */
export interface ModelLimits {
  max_context_window_tokens: number;
  max_output_tokens: number;
  max_prompt_tokens: number;
  reasoning_tokens?: number; // 思考模式专用
  vision?: VisionLimits;
}

/**
 * 视觉能力限制
 */
export interface VisionLimits {
  max_images: number;
  max_image_size: number;
  supported_formats: string[];
}

/**
 * 模型支持的功能
 */
export interface ModelSupports {
  streaming?: boolean;
  tool_calls?: boolean;
  parallel_tool_calls?: boolean;
  vision?: boolean;
  structured_outputs?: boolean;
  thinking?: boolean; // 自定义功能：思考模式
}

/**
 * 模型配置文件结构
 */
export interface ModelConfigFile {
  models: ModelConfig[];
  object: 'list';
  meta: ModelConfigMeta;
}

/**
 * 模型配置元数据
 */
export interface ModelConfigMeta {
  version: string;
  lastUpdated: string;
  source: string;
  description: string;
  officialDoc?: string;
  supportedFeatures?: {
    categories: string[];
    capabilities: string[];
  };
}

/**
 * 默认参数配置
 */
export interface DefaultParameters {
  chat: {
    temperature: number;
    top_p: number;
    max_tokens: number;
    stream: boolean;
    frequency_penalty: number;
    presence_penalty: number;
  };
}

/**
 * 提供商配置结构
 */
export interface ProviderConfig {
  models: ModelConfig[];
  object: 'list';
  meta: ModelConfigMeta;
  defaultParameters?: DefaultParameters;
  endpoints?: Record<string, string>;
  authentication?: {
    type: string;
    header: string;
    prefix: string;
  };
  baseUrl?: string;
}

// 模型发现服务接口
export interface ModelDiscoveryService {
  getAvailableModels(): Promise<string[]>;
  getModelConfig(modelName: string): Promise<ModelConfig | null>;
  refreshModels?(): Promise<void>;
}

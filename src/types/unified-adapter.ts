// OpenAI统一适配器类型定义

export interface UnifiedProvider {
  name: 'volcengine' | 'dashscope' | 'tencentds' | 'deepseek';
  displayName: string;
  baseURL: string;
  apiKey: string;
  defaultModel?: string;
  supportedModels: string[];
}

export interface UnifiedAdapterConfig {
  providers: UnifiedProvider[];
  defaultProvider?: 'volcengine' | 'dashscope' | 'tencentds' | 'deepseek';
}

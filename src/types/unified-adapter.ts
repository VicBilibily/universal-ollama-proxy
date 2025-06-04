// OpenAI统一适配器类型定义

export interface UnifiedProvider {
  name: string;
  displayName: string;
  baseURL: string;
  apiKey: string;
  headers?: Record<string, string>;
}

export interface UnifiedAdapterConfig {
  providers: UnifiedProvider[];
  defaultProvider?: string;
  fallbackProvider?: string;
  modelMapping?: Record<string, string>;
}

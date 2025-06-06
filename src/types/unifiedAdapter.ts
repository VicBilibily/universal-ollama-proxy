// OpenAI统一适配器类型定义

export interface UnifiedProvider {
  name: string;
  displayName: string;
  baseURL: string;
  apiKey: string;
  headers?: Record<string, string>;
  enabled?: boolean; // 设置为false可临时停用该提供商
}

export interface UnifiedAdapterConfig {
  providers: UnifiedProvider[];
}

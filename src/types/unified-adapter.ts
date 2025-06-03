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

export interface ChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content:
      | string
      | Array<{
          type: 'text' | 'image_url';
          text?: string;
          image_url?: {
            url: string;
            detail?: 'low' | 'high' | 'auto';
          };
        }>;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  }>;
}

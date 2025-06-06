// OpenAI API 兼容类型定义

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface OpenAIChatRequest {
  model: string;
  messages: OpenAIChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  user?: string;
  functions?: {
    name: string;
    description?: string;
    parameters?: object;
  }[];
  function_call?: 'none' | 'auto' | { name: string };
  tools?: {
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters?: object;
    };
  }[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  reasoning?: {
    max_tokens?: number;
  };
}

export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

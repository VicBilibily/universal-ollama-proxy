import { OpenAIChatRequest, OpenAIChatResponse, OpenAIChatStreamResponse, OpenAIChatMessage } from './openai';

/**
 * DashScope API 请求类型
 */
export interface DashScopeRequest {
  model: string;
  input: {
    messages: DashScopeMessage[];
  };
  parameters?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_tokens?: number;
    repetition_penalty?: number;
    stream?: boolean;
    enable_search?: boolean;
    incremental_output?: boolean;
  };
}

/**
 * DashScope 消息类型
 */
export interface DashScopeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | DashScopeContent[];
}

/**
 * DashScope 内容类型（支持多模态）
 */
export interface DashScopeContent {
  type: 'text' | 'image' | 'audio';
  text?: string;
  image?: string; // base64 或 URL
  audio?: string; // base64 或 URL
}

/**
 * DashScope API 响应类型
 */
export interface DashScopeResponse {
  output: {
    text?: string;
    choices?: Array<{
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }>;
    finish_reason?: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
  model?: string; // 添加可选的 model 字段
}

/**
 * DashScope 流式响应类型
 */
export interface DashScopeStreamResponse {
  output: {
    text?: string;
    choices?: Array<{
      delta: {
        role?: string;
        content?: string;
      };
      finish_reason?: string;
    }>;
    finish_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

/**
 * DashScope 错误响应类型
 */
export interface DashScopeError {
  code: string;
  message: string;
  request_id?: string;
}

/**
 * DashScope 模型信息类型
 */
export interface DashScopeModelInfo {
  model_name: string;
  model_id: string;
  description: string;
  input_modalities: string[];
  output_modalities: string[];
  parameter_size?: string;
  context_length: number;
  capabilities: string[];
}

/**
 * DashScope 配置类型
 */
export interface DashScopeConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

/**
 * DashScope 请求选项
 */
export interface DashScopeRequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
}

// Ollama API 类型定义

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[]; // Ollama 0.9.0 格式：families 字段为字符串数组
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

// 为了兼容性添加 OllamaListResponse 类型别名
export type OllamaListResponse = OllamaModelsResponse;

export interface OllamaShowRequest {
  model: string;
}

export interface OllamaShowResponse {
  license: string;
  modelfile: string;
  parameters: string;
  template: string;
  system: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  model_info: {
    'general.architecture'?: string;
    'general.basename'?: string;
    'general.file_type'?: number;
    'general.parameter_count'?: number;
    'general.quantization_version'?: number;
    'general.size_label'?: string;
    'general.tags'?: string[] | null;
    'general.languages'?: string[] | null;
    'general.license'?: string;
    'general.name'?: string;
    'general.finetune'?: string;
    'general.type'?: string;
    'general.license.link'?: string;
    'general.base_model.0.name'?: string;
    'general.base_model.0.organization'?: string;
    'general.base_model.0.repo_url'?: string;
    'general.base_model.count'?: number;
    'llama.vocab_size'?: number;
    'llama.context_length'?: number;
    'llama.embedding_length'?: number;
    'llama.block_count'?: number;
    'llama.feed_forward_length'?: number;
    'llama.attention.head_count'?: number;
    'llama.attention.head_count_kv'?: number;
    'llama.attention.layer_norm_rms_epsilon'?: number;
    'llama.rope.dimension_count'?: number;
    'llama.rope.freq_base'?: number;
    'llama.rope.scaling.type'?: string;
    'qwen2.attention.head_count'?: number;
    'qwen2.attention.head_count_kv'?: number;
    'qwen2.attention.layer_norm_rms_epsilon'?: number;
    'qwen2.block_count'?: number;
    'qwen2.context_length'?: number;
    'qwen2.embedding_length'?: number;
    'qwen2.feed_forward_length'?: number;
    'qwen2.rope.freq_base'?: number;
    'tokenizer.ggml.model'?: string;
    'tokenizer.ggml.pre'?: string;
    'tokenizer.ggml.tokens'?: string[] | null;
    'tokenizer.ggml.scores'?: number[] | null;
    'tokenizer.ggml.token_type'?: number[] | null;
    'tokenizer.ggml.merges'?: any;
    'tokenizer.ggml.bos_token_id'?: number;
    'tokenizer.ggml.eos_token_id'?: number;
    'tokenizer.ggml.unknown_token_id'?: number;
    'tokenizer.ggml.separator_token_id'?: number;
    'tokenizer.ggml.padding_token_id'?: number;
    'tokenizer.ggml.add_bos_token'?: boolean;
    'tokenizer.ggml.add_eos_token'?: boolean;
    [key: string]: any; // 允许其他动态字段
  };
  projector_info: any;
  tensors: Array<{
    name: string;
    shape: number[];
    type: string;
  }>;
  capabilities: string[];
  modified_at: string;
}

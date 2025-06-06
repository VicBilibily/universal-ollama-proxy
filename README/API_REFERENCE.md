# 📡 API 接口文档

本文档详细说明 Universal Ollama
Proxy 提供的所有 API 接口，包括 Ollama 兼容接口和 OpenAI 兼容接口。

## 🎯 接口概览

### Ollama 兼容接口

- `GET /` - 健康检查和服务状态
- `GET /api/version` - 获取服务版本信息
- `GET /api/tags` - 获取可用模型列表
- `POST /api/show` - 显示特定模型信息

### OpenAI 兼容接口

- `POST /v1/chat/completions` - 聊天完成接口（流式/非流式）

## 🏥 健康检查接口

### GET /

**描述**: 服务健康检查和基本状态信息

**请求示例**:

```bash
curl http://localhost:11434/
```

**响应示例**:

```json
{
  "status": "ok",
  "service": "Universal Ollama Proxy",
  "version": "1.0.2",
  "uptime": "2 hours, 15 minutes",
  "providers": {
    "available": 3,
    "active": ["volcengine", "dashscope", "deepseek"]
  },
  "models": {
    "total": 25,
    "byProvider": {
      "volcengine": 12,
      "dashscope": 8,
      "deepseek": 5
    }
  }
}
```

## 📋 版本信息接口

### GET /api/version

**描述**: 获取详细的服务版本和构建信息

**请求示例**:

```bash
curl http://localhost:11434/api/version
```

**响应示例**:

```json
{
  "version": "1.0.2",
  "build": {
    "date": "2025-06-06T12:00:00Z",
    "commit": "abc123def456",
    "node": "16.20.0"
  },
  "ollama": {
    "version": "0.1.0",
    "api_version": "1.0"
  }
}
```

## 🎯 模型列表接口

### GET /api/tags

**描述**: 获取所有可用模型的详细列表

**请求示例**:

```bash
curl http://localhost:11434/api/tags
```

**响应示例**:

```json
{
  "models": [
    {
      "name": "volcengine:doubao-1.5-pro-32k-250115",
      "modified_at": "2025-06-06T12:00:00Z",
      "size": 0,
      "digest": "sha256:abc123...",
      "details": {
        "format": "gguf",
        "family": "doubao",
        "families": ["doubao"],
        "parameter_size": "72B",
        "quantization_level": "Q4_0"
      }
    },
    {
      "name": "dashscope:qwen-max",
      "modified_at": "2025-06-06T12:00:00Z",
      "size": 0,
      "digest": "sha256:def456...",
      "details": {
        "format": "gguf",
        "family": "qwen",
        "families": ["qwen"],
        "parameter_size": "110B",
        "quantization_level": "Q4_0"
      }
    }
  ]
}
```

**模型命名格式**: `provider:model`

- `volcengine:doubao-1.5-pro-32k-250115` - 火山引擎的豆包模型
- `dashscope:qwen-max` - 阿里云百炼的通义千问模型
- `deepseek:deepseek-chat` - DeepSeek官方聊天模型

## 🔍 模型详情接口

### POST /api/show

**描述**: 显示特定模型的详细信息

**请求体**:

```json
{
  "name": "volcengine:doubao-1.5-pro-32k-250115"
}
```

**请求示例**:

```bash
curl -X POST http://localhost:11434/api/show \
  -H "Content-Type: application/json" \
  -d '{"name": "volcengine:doubao-1.5-pro-32k-250115"}'
```

**响应示例**:

```json
{
  "modelfile": "# Model: doubao-1.5-pro-32k-250115\n# Provider: volcengine\n",
  "parameters": {
    "max_tokens": 32768,
    "temperature": 0.7,
    "top_p": 0.95
  },
  "template": "{{ .System }}{{ .Prompt }}",
  "details": {
    "format": "gguf",
    "family": "doubao",
    "families": ["doubao"],
    "parameter_size": "72B",
    "quantization_level": "Q4_0"
  },
  "model_info": {
    "general.architecture": "transformer",
    "general.parameter_count": 72000000000,
    "general.quantization_version": 2
  }
}
```

## 💬 聊天完成接口

### POST /v1/chat/completions

**描述**: OpenAI 兼容的聊天完成接口，支持流式和非流式响应

#### 非流式请求

**请求体**:

```json
{
  "model": "volcengine:doubao-1.5-pro-32k-250115",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 0.95,
  "stream": false
}
```

**请求示例**:

```bash
curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "volcengine:doubao-1.5-pro-32k-250115",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7,
    "max_tokens": 1000
  }'
```

**响应示例**:

```json
{
  "id": "chatcmpl-abc123def456",
  "object": "chat.completion",
  "created": 1733472000,
  "model": "volcengine:doubao-1.5-pro-32k-250115",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. I'm here and ready to help you with any questions or tasks you might have. How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 32,
    "total_tokens": 47
  }
}
```

#### 流式请求

**请求体**:

```json
{
  "model": "volcengine:doubao-1.5-pro-32k-250115",
  "messages": [
    {
      "role": "user",
      "content": "Write a short poem about AI"
    }
  ],
  "temperature": 0.8,
  "max_tokens": 500,
  "stream": true
}
```

**请求示例**:

```bash
curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "volcengine:doubao-1.5-pro-32k-250115",
    "messages": [
      {"role": "user", "content": "Write a short poem"}
    ],
    "stream": true
  }' \
  --no-buffer
```

**流式响应示例**:

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1733472000,"model":"volcengine:doubao-1.5-pro-32k-250115","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1733472000,"model":"volcengine:doubao-1.5-pro-32k-250115","choices":[{"index":0,"delta":{"content":"In"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1733472000,"model":"volcengine:doubao-1.5-pro-32k-250115","choices":[{"index":0,"delta":{"content":" circuits"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1733472000,"model":"volcengine:doubao-1.5-pro-32k-250115","choices":[{"index":0,"delta":{"content":" deep"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1733472000,"model":"volcengine:doubao-1.5-pro-32k-250115","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":25,"total_tokens":35}}]

data: [DONE]
```

### 请求参数说明

| 参数名              | 类型         | 必需 | 默认值 | 说明                             |
| ------------------- | ------------ | ---- | ------ | -------------------------------- |
| `model`             | string       | ✅   | -      | 模型名称，格式：`provider:model` |
| `messages`          | array        | ✅   | -      | 对话消息数组                     |
| `temperature`       | number       | ❌   | 0.7    | 控制随机性，范围 0-2             |
| `max_tokens`        | number       | ❌   | 1000   | 最大生成令牌数                   |
| `top_p`             | number       | ❌   | 0.95   | 核采样参数，范围 0-1             |
| `stream`            | boolean      | ❌   | false  | 是否启用流式响应                 |
| `stop`              | string/array | ❌   | null   | 停止生成的字符串                 |
| `presence_penalty`  | number       | ❌   | 0      | 存在惩罚，范围 -2.0 到 2.0       |
| `frequency_penalty` | number       | ❌   | 0      | 频率惩罚，范围 -2.0 到 2.0       |

### 消息格式

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

**角色说明**:

- `system`: 系统消息，设置AI助手的行为
- `user`: 用户消息
- `assistant`: AI助手的回复

## 🛡️ 工具调用支持

某些模型支持工具调用功能（如 OpenRouter 的 Claude 模型）：

### 工具调用请求

```json
{
  "model": "openrouter:anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Beijing?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather information for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "The city name"
            }
          },
          "required": ["city"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

### 工具调用响应

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1733472000,
  "model": "openrouter:anthropic/claude-3.5-sonnet",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"city\": \"Beijing\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

## ❌ 错误处理

### 错误响应格式

```json
{
  "error": {
    "code": "invalid_request_error",
    "message": "Invalid model specified",
    "type": "invalid_request_error",
    "param": "model"
  }
}
```

### 常见错误码

| 错误码                  | HTTP状态码 | 说明             |
| ----------------------- | ---------- | ---------------- |
| `invalid_request_error` | 400        | 请求参数错误     |
| `authentication_error`  | 401        | API Key 认证失败 |
| `permission_error`      | 403        | 权限不足         |
| `not_found_error`       | 404        | 模型或资源未找到 |
| `rate_limit_error`      | 429        | 请求频率超限     |
| `api_error`             | 500        | 服务器内部错误   |
| `timeout_error`         | 504        | 请求超时         |

### 错误处理示例

```bash
# 错误：模型不存在
curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "invalid:model", "messages": [{"role": "user", "content": "Hello"}]}'

# 响应
{
  "error": {
    "code": "not_found_error",
    "message": "Model 'invalid:model' not found",
    "type": "invalid_request_error",
    "param": "model"
  }
}
```

## 🔄 重试和速率限制

### 自动重试

系统内置智能重试机制：

- 网络错误：最多重试 3 次
- 临时故障：指数退避重试
- 速率限制：自动延迟重试

### 速率限制

- 每个API Key有独立的速率限制
- 不同提供商的限制不同
- 超出限制时返回 429 错误

## 📊 使用统计

### 令牌使用

响应中的 `usage` 字段包含详细的令牌使用统计：

```json
{
  "usage": {
    "prompt_tokens": 15, // 输入令牌数
    "completion_tokens": 32, // 输出令牌数
    "total_tokens": 47 // 总令牌数
  }
}
```

### 日志记录

启用 `CHAT_LOGS=true`
时，所有请求和响应都会详细记录到日志文件中，便于分析和调试。

---

## 📚 相关文档

- [返回主页](../README.md)
- [详细特性说明](./FEATURES.md)
- [支持的模型](./SUPPORTED_MODELS.md)
- [安装指南](./INSTALLATION_GUIDE.md)
- [配置参数详解](./CONFIGURATION.md)
- [开发指南](./DEVELOPMENT.md)
- [故障排除](./TROUBLESHOOTING.md)

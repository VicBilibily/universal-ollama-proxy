# AI 模型配置格式规范

本文档定义了统一 AI 模型代理服务的模型配置格式，该格式参考了 GitHub
Copilot 的模型列表标准，以确保配置的一致性和可扩展性。

## 总体结构

模型配置文件应采用以下 JSON 结构：

```json
{
  "models": [
    {
      // 模型配置对象...
    }
  ],
  "object": "list",
  "meta": {
    // 元数据...
  }
}
```

## 模型配置对象

每个模型配置对象包含以下字段：

### 基本信息字段

| 字段名                 | 类型    | 必需 | 描述                                 |
| ---------------------- | ------- | ---- | ------------------------------------ |
| `id`                   | string  | ✅   | 模型的唯一标识符，通常与 `name` 相同 |
| `name`                 | string  | ✅   | 模型的显示名称                       |
| `object`               | string  | ✅   | 固定值："model"                      |
| `vendor`               | string  | ✅   | 模型提供商名称                       |
| `version`              | string  | ✅   | 模型版本信息                         |
| `preview`              | boolean | ✅   | 是否为预览版本                       |
| `model_picker_enabled` | boolean | ✅   | 是否在模型选择器中启用               |

### 能力配置 (capabilities)

```json
{
  "capabilities": {
    "family": "string",           // 模型族名称，如 "gpt-4o", "claude-3.5-sonnet"
    "limits": {                   // 模型限制
      "max_context_window_tokens": number,    // 最大上下文窗口
      "max_output_tokens": number,            // 最大输出token数
      "max_prompt_tokens": number,            // 最大提示token数
      "vision": {                             // 视觉能力限制（可选）
        "max_images": number,
        "max_image_size": number,
        "supported_formats": ["jpg", "png", "webp"]
      }
    },
    "object": "model_capabilities",
    "supports": {                 // 支持的功能
      "streaming": boolean,       // 是否支持流式输出
      "tool_calls": boolean,      // 是否支持工具调用
      "parallel_tool_calls": boolean,  // 是否支持并行工具调用
      "vision": boolean,          // 是否支持视觉理解
      "structured_outputs": boolean,   // 是否支持结构化输出
      "thinking": boolean         // 是否支持思考模式（自定义）
    },
    "tokenizer": "string",        // 使用的分词器，如 "cl100k_base", "o200k_base"
    "type": "chat"                // 模型类型（仅支持聊天模型）
  }
}
```

### 策略配置 (policy) - 可选

```json
{
  "policy": {
    "state": "enabled" | "disabled",
    "terms": "string"              // 使用条款描述
  }
}
```

## 完整示例

### 聊天模型示例

```json
{
  "id": "doubao-1.5-pro-32k",
  "name": "豆包1.5 Pro 32K",
  "object": "model",
  "vendor": "ByteDance",
  "version": "doubao-1.5-pro-32k-250115",
  "preview": false,
  "model_picker_enabled": true,
  "capabilities": {
    "family": "doubao-1.5-pro",
    "limits": {
      "max_context_window_tokens": 32768,
      "max_output_tokens": 4096,
      "max_prompt_tokens": 28672
    },
    "object": "model_capabilities",
    "supports": {
      "streaming": true,
      "tool_calls": true,
      "parallel_tool_calls": true,
      "vision": false,
      "structured_outputs": true
    },
    "tokenizer": "cl100k_base",
    "type": "chat"
  }
}
```

### 视觉模型示例

```json
{
  "id": "doubao-1.5-vision-pro",
  "name": "豆包1.5 视觉 Pro",
  "object": "model",
  "vendor": "ByteDance",
  "version": "doubao-1.5-vision-pro-250115",
  "preview": false,
  "model_picker_enabled": true,
  "capabilities": {
    "family": "doubao-1.5-vision",
    "limits": {
      "max_context_window_tokens": 128000,
      "max_output_tokens": 4096,
      "max_prompt_tokens": 120000,
      "vision": {
        "max_images": 10,
        "max_image_size": 20971520,
        "supported_formats": ["jpg", "jpeg", "png", "webp", "gif"]
      }
    },
    "object": "model_capabilities",
    "supports": {
      "streaming": true,
      "tool_calls": true,
      "parallel_tool_calls": true,
      "vision": true,
      "structured_outputs": true
    },
    "tokenizer": "cl100k_base",
    "type": "chat"
  }
}
```

### 思考模型示例

```json
{
  "id": "doubao-1.5-thinking-pro",
  "name": "豆包1.5 深度思考 Pro",
  "object": "model",
  "vendor": "ByteDance",
  "version": "doubao-1.5-thinking-pro-250415",
  "preview": false,
  "model_picker_enabled": true,
  "capabilities": {
    "family": "doubao-1.5-thinking",
    "limits": {
      "max_context_window_tokens": 128000,
      "max_output_tokens": 16000,
      "max_prompt_tokens": 96000,
      "reasoning_tokens": 32000
    },
    "object": "model_capabilities",
    "supports": {
      "streaming": true,
      "tool_calls": true,
      "thinking": true,
      "structured_outputs": true
    },
    "tokenizer": "cl100k_base",
    "type": "chat"
  }
}
```

## 元数据配置

```json
{
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2025-06-04",
    "source": "https://api.provider.com/v1",
    "description": "提供商模型配置文件",
    "officialDoc": "https://docs.provider.com/models",
    "supportedFeatures": {
      "categories": ["chat", "vision", "thinking"],
      "capabilities": ["streaming", "tool_calls", "vision", "thinking"]
    }
  }
}
```

## 字段映射指南

从旧格式迁移到新格式的字段映射：

| 旧字段             | 新字段路径                                      | 说明       |
| ------------------ | ----------------------------------------------- | ---------- |
| `name`             | `id`                                            | 模型标识符 |
| `displayName`      | `name`                                          | 显示名称   |
| `type`             | `capabilities.type`                             | 模型类型   |
| `contextLength`    | `capabilities.limits.max_context_window_tokens` | 上下文长度 |
| `outputLength`     | `capabilities.limits.max_output_tokens`         | 输出长度   |
| `inputLength`      | `capabilities.limits.max_prompt_tokens`         | 输入长度   |
| `reasoningLength`  | `capabilities.limits.reasoning_tokens`          | 推理长度   |
| `rateLimits.rpm`   | 移至提供商级别配置                              | 速率限制   |
| `rateLimits.tpm`   | 移至提供商级别配置                              | Token限制  |
| `capabilities`     | `capabilities.supports`                         | 功能支持   |
| `recommended`      | `model_picker_enabled`                          | 是否推荐   |
| `supportedFormats` | `capabilities.limits.vision.supported_formats`  | 支持格式   |

## 验证规则

1. **必需字段**：所有标记为必需的字段都必须存在
2. **数据类型**：字段值必须符合指定的数据类型
3. **枚举值**：枚举字段的值必须在允许的范围内
4. **逻辑一致性**：
   - 如果 `supports.vision` 为 `true`，则必须提供 `limits.vision` 配置
   - 如果 `supports.thinking` 为 `true`，建议提供 `reasoning_tokens` 限制
   - `max_prompt_tokens` + `max_output_tokens` 应该 ≤
     `max_context_window_tokens`

## 最佳实践

1. **命名规范**：

   - 模型 ID 使用小写字母、数字和连字符
   - 显示名称使用用户友好的格式
   - 族名称保持一致性

2. **版本管理**：

   - 使用语义化版本号
   - 在版本字段中包含完整的模型版本信息

3. **能力描述**：

   - 准确反映模型的实际能力
   - 保守设置限制值以确保稳定性

4. **文档维护**：
   - 定期更新 `lastUpdated` 字段
   - 提供清晰的描述和官方文档链接

## 扩展指南

为新提供商创建模型配置时：

1. 复制现有提供商的配置文件作为模板
2. 根据提供商的官方文档更新模型信息
3. 测试所有声明的能力
4. 更新元数据信息
5. 验证配置文件的 JSON 语法正确性

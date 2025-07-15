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
      "reasoning_tokens": number,             // 推理思考token数限制（可选，用于支持thinking的模型）
      "thinking_type": "enabled|disabled|auto", // 思考模式配置（可选，火山引擎专用）
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

### OpenRouter 聚合模型示例

OpenRouter 平台的模型配置示例，展示了自动生成的配置格式：

```json
{
  "id": "openai/gpt-4o-2024-11-20",
  "name": "GPT-4o",
  "object": "model",
  "vendor": "openai",
  "version": "2024-11-20",
  "preview": false,
  "model_picker_enabled": false,
  "capabilities": {
    "family": "gpt-4o",
    "limits": {
      "max_context_window_tokens": 128000,
      "max_output_tokens": 16384,
      "max_prompt_tokens": 112000
    },
    "object": "model_capabilities",
    "supports": {
      "streaming": true,
      "tool_calls": true,
      "parallel_tool_calls": true,
      "vision": true,
      "structured_outputs": true
    },
    "tokenizer": "o200k_base",
    "type": "chat"
  }
}
```

### 免费模型示例

自动启用的免费模型配置：

```json
{
  "id": "deepseek/deepseek-chat:free",
  "name": "DeepSeek V3 (free)",
  "object": "model",
  "vendor": "deepseek",
  "version": "1.0",
  "preview": false,
  "model_picker_enabled": true,
  "capabilities": {
    "family": "DeepSeek",
    "limits": {
      "max_context_window_tokens": 128000,
      "max_output_tokens": 8192,
      "max_prompt_tokens": 120000
    },
    "object": "model_capabilities",
    "supports": {
      "streaming": true,
      "tool_calls": true,
      "parallel_tool_calls": false,
      "vision": false,
      "structured_outputs": false
    },
    "tokenizer": "o200k_base",
    "type": "chat"
  }
}
```

### Claude 思考模型示例

带有思考推理能力的 Claude 模型：

```json
{
  "id": "anthropic/claude-3.7-sonnet:thinking",
  "name": "Claude Sonnet 3.7 Thinking",
  "object": "model",
  "vendor": "anthropic",
  "version": "3.7",
  "preview": false,
  "model_picker_enabled": true,
  "capabilities": {
    "family": "claude-3.7-sonnet-thought",
    "limits": {
      "max_context_window_tokens": 200000,
      "max_output_tokens": 8192,
      "max_prompt_tokens": 192000,
      "reasoning_tokens": 4096
    },
    "object": "model_capabilities",
    "supports": {
      "streaming": true,
      "tool_calls": true,
      "parallel_tool_calls": false,
      "vision": false,
      "structured_outputs": true,
      "thinking": true
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
    "lastUpdated": "2025-07-15",
    "source": "https://openrouter.ai/api/v1",
    "description": "OpenRouter 模型配置文件 - 基于 GitHub Copilot 官方支持模型动态生成，并包含额外的Grok、Qwen、DeepSeek、Moonshot、Tencent、Baidu、Mistral、Google、THUDM系列模型",
    "originalSource": "scripts/models/GitHub.json",
    "mappingCount": 225,
    "supportedFeatures": {
      "categories": ["chat"],
      "capabilities": [
        "tool_calls",
        "streaming",
        "structured_outputs",
        "vision",
        "parallel_tool_calls",
        "thinking"
      ]
    },
    "additionalSeries": [
      "Grok",
      "Qwen",
      "DeepSeek",
      "Moonshot",
      "Tencent",
      "Baidu",
      "Mistral",
      "Google",
      "THUDM"
    ],
    "freeModelsCount": 50,
    "thinkingModelsCount": 50,
    "autoGenerated": true,
    "generationScript": "scripts/models/generate-openrouter-models.js"
  }
}
```

### 扩展元数据字段

| 字段名                | 类型     | 描述                       |
| --------------------- | -------- | -------------------------- |
| `mappingCount`        | number   | 总映射模型数量             |
| `additionalSeries`    | string[] | 额外支持的模型系列         |
| `freeModelsCount`     | number   | 免费模型数量               |
| `thinkingModelsCount` | number   | 思考模型数量               |
| `autoGenerated`       | boolean  | 是否为自动生成的配置       |
| `generationScript`    | string   | 生成脚本路径               |
| `deduplicationCount`  | number   | 去重的重复模型数量（可选） |

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
   - 免费模型（ID包含`:free`）应设置 `model_picker_enabled: true`
   - 思考模型应具有 `supports.thinking: true` 和合理的 `reasoning_tokens` 值

## OpenRouter 模型生成最佳实践

1. **自动生成流程**：

   - 使用 `scripts/models/generate-openrouter-models.js` 生成配置
   - 基于 GitHub Copilot 官方模型进行匹配和转换
   - 自动发现和添加额外的模型系列

2. **模型匹配策略**：

   - 优先精确ID匹配
   - 版本信息匹配作为辅助
   - 相似度算法作为最后选择
   - 智能去重重复模型

3. **特性检测自动化**：
   - 自动检测免费模型并启用
   - 自动识别思考模型并配置推理参数
   - 自动设置工具调用和多模态能力

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

### 为新提供商创建模型配置

1. 复制现有提供商的配置文件作为模板
2. 根据提供商的官方文档更新模型信息
3. 测试所有声明的能力
4. 更新元数据信息
5. 验证配置文件的 JSON 语法正确性

### OpenRouter 模型配置生成

对于 OpenRouter 聚合模型，建议使用自动生成脚本：

1. **运行生成脚本**：

   ```bash
   node scripts/models/generate-openrouter-models.js
   ```

2. **配置验证**：

   - 检查生成的模型数量是否合理（通常200+个）
   - 验证免费模型已正确启用
   - 确认思考模型具有正确的配置

3. **定期更新**：
   - OpenRouter 模型库会定期更新
   - 建议定期重新生成配置以获取最新模型
   - 关注新的模型系列和功能特性

### 自定义模型系列添加

要添加新的模型系列到 OpenRouter 生成脚本：

1. 在 `getAdditionalModelSeries` 函数的 `targetSeries` 数组中添加新系列
2. 配置匹配规则：
   ```javascript
   {
     name: 'NewProvider',
     authors: ['newprovider'],
     groups: ['NewProvider'],
     slugPatterns: [/^newprovider\//i],
     namePatterns: [/newprovider/i]
   }
   ```
3. 测试匹配结果和生成的配置

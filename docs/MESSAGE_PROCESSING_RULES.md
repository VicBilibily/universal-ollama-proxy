# 消息处理规则配置说明

本文档详细介绍如何配置和使用消息处理规则系统，该系统允许您自定义对系统提示词的处理逻辑，包括移除或替换特定内容。

## 📋 目录

- [概述](#概述)
- [配置文件位置](#配置文件位置)
- [配置文件结构](#配置文件结构)
- [规则类型](#规则类型)
- [配置示例](#配置示例)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 概述

消息处理规则系统允许您：

- ✅ **移除限制性内容**: 自动删除不需要的提示词部分
- ✅ **替换特定文本**: 修改系统提示词中的特定表述
- ✅ **配置驱动**: 无需修改代码，通过配置文件管理所有规则
- ✅ **自动应用**: 仅对第一条消息（通常是系统提示词）自动处理
- ✅ **日志记录**: 可选的处理日志，便于调试和监控

## 配置文件位置

配置文件位于项目根目录下：

```
config/message-processing-rules.json
```

## 配置文件结构

### 基本结构

```json
{
  "promptProcessingRules": {
    "enabled": true,
    "rules": [
      // 规则数组
    ]
  },
  "processingOptions": {
    "logChanges": true,
    "description": "处理选项配置"
  }
}
```

### 字段说明

| 字段                            | 类型    | 必需 | 说明             |
| ------------------------------- | ------- | ---- | ---------------- |
| `promptProcessingRules.enabled` | boolean | ✅   | 是否启用规则处理 |
| `promptProcessingRules.rules`   | array   | ✅   | 规则数组         |
| `processingOptions.logChanges`  | boolean | ✅   | 是否记录处理日志 |
| `processingOptions.description` | string  | ❌   | 配置描述信息     |

## 规则类型

### 1. 移除规则 (remove)

用于删除匹配的文本内容。

```json
{
  "name": "规则名称",
  "type": "remove",
  "patterns": ["要删除的文本1", "要删除的文本2"],
  "description": "规则描述"
}
```

**字段说明：**

- `name`: 规则的唯一标识符
- `type`: 必须为 `"remove"`
- `patterns`: 要删除的文本模式数组
- `description`: 规则的可读描述

### 2. 替换规则 (replace)

用于将匹配的文本替换为新内容。

```json
{
  "name": "规则名称",
  "type": "replace",
  "pattern": "要替换的文本",
  "replacement": "替换后的文本",
  "description": "规则描述"
}
```

**字段说明：**

- `name`: 规则的唯一标识符
- `type`: 必须为 `"replace"`
- `pattern`: 要匹配和替换的文本
- `replacement`: 替换后的新文本
- `description`: 规则的可读描述

## 配置示例

### 完整配置示例

```json
{
  "promptProcessingRules": {
    "enabled": true,
    "rules": [
      {
        "name": "github_copilot_identity",
        "type": "replace",
        "pattern": "you must respond with \"GitHub Copilot\".",
        "replacement": "you can respond with \"GitHub Copilot\".",
        "description": "修改 GitHub Copilot 身份限制，从强制改为可选"
      },
      {
        "name": "microsoft_content_policies",
        "type": "remove",
        "patterns": [
          "Follow Microsoft content policies.\n",
          "Follow Microsoft content policies.",
          "Follow the Microsoft content policies.\n",
          "Follow the Microsoft content policies."
        ],
        "description": "移除 Microsoft 内容策略限制"
      },
      {
        "name": "copyright_restrictions",
        "type": "remove",
        "patterns": [
          "Avoid content that violates copyrights.\n",
          "Avoid content that violates copyrights.",
          "Avoid content that violates copyright.\n",
          "Avoid content that violates copyright."
        ],
        "description": "移除版权限制"
      },
      {
        "name": "development_topic_filter",
        "type": "remove",
        "patterns": [
          "For questions not related to software development, simply give a reminder that you are an AI programming assistant.\r\n"
        ],
        "description": "移除开发话题过滤提示"
      },
      {
        "name": "skip_tip",
        "type": "remove",
        "patterns": [", or completely irrelevant to software engineering"],
        "description": "移除跳过提示"
      }
    ]
  },
  "processingOptions": {
    "logChanges": true,
    "description": "处理选项配置 - 自动只处理第一条消息"
  }
}
```

### 处理效果示例

**原始系统提示词：**

```
You are an AI programming assistant.
When asked for your name, you must respond with "GitHub Copilot".
Follow Microsoft content policies.
Avoid content that violates copyrights.
For questions not related to software development, simply give a reminder that you are an AI programming assistant.
Keep your answers short and impersonal.
```

**处理后：**

```
You are an AI programming assistant.
When asked for your name, you can respond with "GitHub Copilot".
Keep your answers short and impersonal.
```

## 最佳实践

### 1. 规则命名

- 使用有意义的 `name` 字段，便于识别和管理
- 推荐使用下划线分隔的小写命名：`rule_category_description`

### 2. 模式匹配

- **精确匹配**: 确保 `pattern` 和 `patterns` 中的文本精确匹配原文
- **包含换行符**: 注意原文中的换行符（`\n` 或 `\r\n`）
- **多变体**: 对于可能有多种表达方式的内容，在 `patterns` 数组中包含所有变体

### 3. 规则顺序

- 规则按数组顺序依次执行
- 替换规则可能影响后续规则的匹配，请合理安排顺序

### 4. 测试和验证

在修改配置后，建议进行测试：

```bash
# 构建项目
npm run build

# 运行测试脚本（如果有）
node test-message-processor.js
```

### 5. 备份配置

- 在修改重要配置前，建议备份原配置文件
- 使用版本控制跟踪配置变更

## 故障排除

### 常见问题

#### 1. 规则不生效

**可能原因：**

- `enabled` 设置为 `false`
- 模式匹配不精确（包括空格、换行符等）
- JSON 语法错误

**解决方法：**

- 检查 `promptProcessingRules.enabled` 是否为 `true`
- 仔细对比原文和配置中的文本
- 使用 JSON 验证器检查语法

#### 2. 配置文件加载失败

**可能原因：**

- 文件路径错误
- JSON 格式不正确
- 文件权限问题

**解决方法：**

- 确认文件位于 `config/message-processing-rules.json`
- 检查 JSON 语法（可以使用在线 JSON 验证器）
- 检查文件读取权限

#### 3. 部分文本未被处理

**可能原因：**

- 文本格式不完全匹配（空格、换行符）
- 规则执行顺序导致的影响
- 原文中包含特殊字符

**解决方法：**

- 在 `patterns` 数组中添加所有可能的变体
- 调整规则执行顺序
- 启用日志查看详细处理信息

### 调试技巧

#### 1. 启用详细日志

在配置中设置：

```json
"processingOptions": {
  "logChanges": true
}
```

#### 2. 逐步测试

- 一次只启用一个规则
- 逐个验证每个规则的效果
- 确认无误后再启用全部规则

#### 3. 使用测试脚本

创建简单的测试脚本验证规则效果：

```javascript
const { processSystemPrompt } = require('./dist/utils/messageProcessor');

const testText = 'Your test prompt here...';
const result = processSystemPrompt(testText);

console.log('原文:', testText);
console.log('处理后:', result);
```

## 技术支持

如果您在使用过程中遇到问题：

1. 检查项目日志文件
2. 参考本文档的故障排除部分
3. 在项目 GitHub 仓库提交 Issue
4. 提供详细的错误信息和配置文件内容

---

_本文档随项目更新而更新，请关注最新版本。_

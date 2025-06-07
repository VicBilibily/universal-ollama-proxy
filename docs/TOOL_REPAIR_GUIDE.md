# 工具修复功能使用指南

## 概述

工具修复功能是一个工具兼容性系统，专门为 Anthropic/Claude 模型提供工具参数修复支持。该功能在服务启动时自动初始化，自动处理工具格式兼容性问题。

核心能力：

- 🛡️ **基本验证**: 自动验证工具结构，确保基本格式正确
- ✅ **格式修复**: 自动修复工具结构，补全缺失的必要字段
- 🔧
  **Anthropic/Claude 兼容性**: 专门为 Anthropic 和 Claude 模型提供工具参数修复
- ⚡ **性能优化**: 内置缓存机制，提高修复性能
- 📝 **详细日志**: 多级别日志记录，便于调试和监控

## 系统特性

- **自动缓存**: 内置 LRU 缓存机制，最大缓存 1000 个条目
- **日志输出**: 继承系统 `LOG_LEVEL` 环境变量（默认 info）

## 核心功能

### 1. 工具格式验证和修复

系统会自动验证工具结构的完整性，并尝试修复常见问题：

- **类型字段修复**: 自动添加或修正 `type: "function"` 字段
- **参数补全**: 为缺少 `parameters` 的工具添加空参数对象
- **必需字段检查**: 验证 `function.name` 等必需字段的存在
- **参数结构修复**: 自动添加缺失的 `required` 数组

### 2. Anthropic/Claude 模型专用修复

系统会自动检测 Anthropic 和 Claude 模型，并应用以下修复：

#### 模型检测逻辑

- 模型ID包含 "anthropic" 或 "claude" 关键字
- 提供商名称包含 "anthropic"

#### 自动修复内容

1. **补全缺失的 function.parameters**

   - 为没有 `parameters` 字段的工具自动添加空参数对象
   - 确保参数结构包含 `type: "object"`、`properties: {}`、`required: []`

2. **修复参数结构**
   - 确保 `parameters.type` 为 "object"
   - 添加缺失的 `properties` 对象
   - 添加缺失的 `required` 数组

### 3. 性能优化

- **缓存机制**: 内置LRU缓存，避免重复计算
- **智能跳过**: 对非 Anthropic/Claude 模型执行基本验证但跳过专用修复

## 工作原理

### 处理流程

1. **工具验证**: 检查工具基本结构的完整性
2. **格式修复**: 自动修复常见的格式问题
3. **模型检测**: 识别是否为 Anthropic/Claude 模型
4. **专用修复**: 应用 Anthropic/Claude 特定的修复逻辑
5. **结果缓存**: 缓存处理结果以提高性能

### Anthropic/Claude 检测

系统通过以下方式检测 Anthropic/Claude 模型：

```typescript
// 检查模型ID
modelId.toLowerCase().includes('anthropic') ||
  modelId.toLowerCase().includes('claude');

// 检查提供商
providerName.toLowerCase().includes('anthropic');
```

### 自动修复内容

对于检测到的 Anthropic/Claude 模型，系统会自动应用以下修复：

```json
// 修复前的工具
{
  "type": "function",
  "function": {
    "name": "get_weather"
    // 缺失 parameters 字段
  }
}

// 修复后的工具
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
}
```

## 故障排除

### 常见问题

1. **工具修复不生效**

   - 检查服务启动日志，确认看到"工具修复服务已初始化"消息
   - 确认不是 Anthropic/Claude 模型时，只会进行基本验证
   - 查看日志确认系统是否检测到目标模型

2. **Anthropic/Claude 修复不生效**

   - 检查模型ID是否包含 "anthropic" 或 "claude"
   - 确认提供商检测逻辑是否正确
   - 查看详细日志确认模型检测结果

3. **性能问题**
   - 缓存机制自动运行，无需额外配置
   - 监控缓存命中率日志

### 日志控制

可以通过系统环境变量调整日志输出级别：

```bash
# 调整日志级别（在 .env 文件中）
LOG_LEVEL=none   # 禁用日志
LOG_LEVEL=warn   # 仅警告信息
LOG_LEVEL=debug  # 详细调试信息
```

## 最佳实践

1. **监控日志**: 定期检查工具修复日志，了解修复应用情况
2. **测试验证**: 在测试环境中验证 Anthropic/Claude 模型的工具调用
3. **性能监控**: 关注缓存命中率和处理性能
4. **日志控制**: 通过 `LOG_LEVEL` 环境变量控制日志详细程度

---

_工具修复系统专注于 Anthropic/Claude 模型的兼容性修复，提供可靠和高效的工具处理能力。_

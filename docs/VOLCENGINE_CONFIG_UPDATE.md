# 火山引擎模型配置更新说明

## 2025年6月16日 配置调整

### thinking_type 配置说明

在火山引擎模型配置中，新增了 `thinking_type` 字段来控制深度思考模式：

```json
{
  "capabilities": {
    "limits": {
      "thinking_type": "disabled" // 可选值: enabled, disabled, auto
    }
  }
}
```

**配置说明：**

- `enabled`: 强制开启深度思考模式
- `disabled`: 强制关闭深度思考模式（默认设置）
- `auto`: 让模型自主判断是否需要深度思考

### tool_calls 支持调整

基于实际测试结果，所有豆包seed系列模型的 `tool_calls` 支持已调整为 `false`：

```json
{
  "capabilities": {
    "supports": {
      "tool_calls": false // 经实测参数不完整，暂时禁用
    }
  }
}
```

**调整原因：**

1. 豆包模型生成的工具调用参数经常不完整
2. 缺少必需字段如 `explanation` 导致API调用失败
3. 模型不遵循系统提示中的格式要求

### 影响的模型

以下模型的配置已相应调整：

1. `doubao-seed-1.6-250615` - 基础版本
2. `doubao-seed-1.6-thinking-250615` - 思考增强版
3. `doubao-seed-1.6-flash-250615` - 快速响应版

### 推荐替代方案

对于需要工具调用功能的场景，建议使用：

- OpenAI GPT系列模型 (gpt-4o, gpt-4-turbo等)
- Anthropic Claude系列模型 (claude-3.5-sonnet等)
- 其他完全支持OpenAI格式工具调用的模型

### 相关文档

- [模型配置规范](MODEL_CONFIG_SPECIFICATION.md)
- [豆包模型调整详细说明](VOLCENGINE_TOOLCALLS_ADJUSTMENT.md)
- [工具修复指南](TOOL_REPAIR_GUIDE.md)

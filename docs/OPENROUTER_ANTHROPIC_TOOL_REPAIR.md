# OpenRouter Anthropic 模型工具修复配置说明

## 问题背景

OpenRouter 的 Anthropic 系列模型（如
`anthropic/claude-3.5-sonnet`）在处理工具调用时，有一个特殊要求：工具定义中必须包含
`parameters` 字段，即使是空的参数对象。如果没有 `parameters`
字段，API 将返回以下错误：

```
tools.0.custom.input_schema: Field required
```

## 解决方案

系统内置了针对 OpenRouter 的 Anthropic 模型的自动工具修复功能，会自动为缺失的
`parameters` 字段补全空参数对象。

## 修复逻辑

3. **条件**：

   - `"field": "function.parameters"` - 检查工具定义中的 parameters 字段
   - `"operator": "not_exists"` - 当该字段不存在时触发规则

4. **动作**：
   - `"transform": "complete_parameters"` - 添加一个空的参数对象结构

## 应用效果

转换前：

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "获取天气信息"
  }
}
```

转换后：

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "获取天气信息",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  }
}
```

## 技术实现说明

系统内置了针对 OpenRouter 的 Anthropic 模型的工具修复逻辑：

1. 用户请求使用 `openrouter:anthropic/claude-3.5-sonnet` 模型
2. 在 `UnifiedAdapterService.getProviderModelName()`
   方法中，供应商前缀被移除，留下 `anthropic/claude-3.5-sonnet`
3. 工具修复系统自动检测以 `anthropic/` 开头的模型
4. 对于这些模型，系统会自动补全缺失的 `function.parameters` 字段

此内置修复确保 OpenRouter 的 Anthropic 模型可以正确处理工具调用，同时不影响其他模型的工具处理行为。

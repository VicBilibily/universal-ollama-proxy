# OpenRouter Anthropic 模型工具过滤配置说明

## 问题背景

OpenRouter 的 Anthropic 系列模型（如
`anthropic/claude-3.5-sonnet`）在处理工具调用时，有一个特殊要求：工具定义中必须包含
`parameters` 字段，即使是空的参数对象。如果没有 `parameters`
字段，API 将返回以下错误：

```
tools.0.custom.input_schema: Field required
```

## 解决方案

我们通过工具过滤规则来自动为 OpenRouter 的 Anthropic 模型补全缺失的 `parameters`
字段。以下是正确的配置示例：

```json
{
  "name": "complete_missing_parameters",
  "description": "当工具的 function.parameters 不存在时，补全为空参数对象 (仅适用于 OpenRouter 的 Anthropic 模型)",
  "enabled": true,
  "providers": ["openrouter"],
  "models": ["anthropic/*"],
  "conditions": [
    {
      "field": "function.parameters",
      "operator": "not_exists"
    }
  ],
  "actions": {
    "type": "transform",
    "transform": "complete_parameters"
  },
  "priority": 300,
  "logLevel": "info"
}
```

## 配置要点说明

1. **供应商限制**：

   - `"providers": ["openrouter"]` - 仅适用于 OpenRouter 提供商

2. **模型限制**：

   - `"models": ["anthropic/*"]` - 仅适用于 Anthropic 系列模型
   - **注意**：不要使用带供应商前缀的模式如
     `"openrouter:anthropic/*"`，因为在规则匹配时，模型名称已经去除了供应商前缀

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

在系统内部，模型 ID 的处理流程如下：

1. 用户请求使用 `openrouter:anthropic/claude-3.5-sonnet` 模型
2. 在 `UnifiedAdapterService.getProviderModelName()`
   方法中，供应商前缀被移除，留下 `anthropic/claude-3.5-sonnet`
3. 工具过滤规则的模型匹配使用去除前缀后的模型名称进行匹配
4. 因此，规则模式必须设置为 `anthropic/*` 而非 `openrouter:anthropic/*`

此配置确保 OpenRouter 的 Anthropic 模型可以正确处理工具调用，同时不影响其他模型的工具处理行为。

# 工具过滤规则配置注意事项

## 概述

工具过滤功能是AI模型统一代理服务的核心安全组件，用于验证、修复和过滤传入的工具定义。本文档提供配置规则时的注意事项和最佳实践。

## 核心功能

- **工具验证**: 检查工具定义的有效性和完整性
- **安全过滤**: 根据配置规则过滤危险或不符合要求的工具
- **结构修复**: 自动修复缺失的工具定义字段
- **配置热重载**: 支持运行时重新加载配置，无需重启服务

## 规则格式

### 支持的条件格式

工具过滤支持两种条件格式：

1. **对象格式**（简单匹配）

```json
{
  "conditions": {
    "providers": ["openrouter"],
    "models": ["anthropic/*"],
    "toolPattern": ".*"
  }
}
```

2. **数组格式**（详细条件）

```json
{
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(exec|eval|system).*"
    }
  ]
}
```

### 动作配置

规则必须使用 `actions` 对象格式：

```json
{
  "actions": {
    "type": "transform|remove|warn",
    "transform": "转换类型（当type为transform时必需）"
  }
}
```

支持的转换类型：

- `complete_parameters`: 补全缺失的参数对象

## 操作符使用规范

工具过滤配置中，操作符的正确使用对规则生效至关重要。以下是支持的操作符及其推荐用法：

### 支持的操作符

- **equals**: 完全匹配字符串值

  ```json
  { "field": "function.name", "operator": "equals", "value": "exec" }
  ```

- **not_equals**: 字符串不等于指定值

  ```json
  {
    "field": "function.name",
    "operator": "not_equals",
    "value": "safe_function"
  }
  ```

- **contains**: 字符串包含指定值

  ```json
  { "field": "function.description", "operator": "contains", "value": "危险" }
  ```

- **not_contains**: 字符串不包含指定值

  ```json
  {
    "field": "function.description",
    "operator": "not_contains",
    "value": "安全"
  }
  ```

- **matches**: 正则表达式匹配

  ```json
  { "field": "function.name", "operator": "matches", "regex": "^unsafe_.*" }
  ```

- **exists**: 字段存在且不为空

  ```json
  { "field": "function.description", "operator": "exists" }
  ```

- **not_exists**: 字段不存在或为空
  ```json
  { "field": "function.parameters", "operator": "not_exists" }
  ```

## 常见陷阱与解决方案

### 1. 使用不支持的操作符

❌ **错误示例**:

```json
{ "field": "function.name.length", "operator": "greater_than", "value": 64 }
```

系统不支持 `greater_than` 操作符，这会导致规则无法生效。

✅ **正确做法**: 使用 `matches` 操作符配合正则表达式实现长度检查：

```json
{ "field": "function.name", "operator": "matches", "regex": ".{65,}" }
```

此正则表达式匹配任何长度大于或等于65个字符的名称。

### 2. 使用不支持的操作符组合

❌ **错误示例**:

```json
{
  "field": "function.name",
  "operator": "not_matches",
  "regex": "^[a-zA-Z_][a-zA-Z0-9_]*$"
}
```

系统不支持 `not_matches` 操作符，这会导致规则无法生效。

✅ **正确做法**: 使用 `matches` 操作符并调整正则表达式逻辑：

```json
{
  "field": "function.name",
  "operator": "matches",
  "regex": "[^a-zA-Z0-9_]|^[^a-zA-Z_]"
}
```

此正则表达式匹配任何包含非法字符或不以字母/下划线开头的名称。

### 3. 复杂条件使用技巧

对于复杂规则，可以组合多个条件：

```json
{
  "name": "advanced_validation",
  "type": "validation",
  "conditions": [
    { "field": "function.name", "operator": "exists" },
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^[a-z][a-z0-9_]{1,63}$"
    }
  ],
  "actions": {
    "type": "warn"
  }
}
```

### 4. 字段路径深度注意事项

访问嵌套字段时使用点号分隔：

```json
{
  "field": "function.parameters.properties.key.type",
  "operator": "equals",
  "value": "string"
}
```

## 性能注意事项

- 复杂的正则表达式可能影响性能，特别是在高流量场景
- 优先使用 `equals` 和 `contains` 等简单操作符
- 合理设置缓存参数以减少重复计算

## 配置文件热重载

工具过滤配置文件(`tool-filter-rules.json`)支持热重载，当您修改配置文件后，系统会自动检测变更并重新加载配置，无需重启服务。

### 热重载流程

1. 修改 `config/tool-filter-rules.json` 文件
2. 系统检测到文件变更并重新加载配置
3. 在日志中输出重新加载的结果和统计信息
4. 新的规则立即生效，应用于后续请求

### 热重载注意事项

- 修改配置文件前建议备份，以防配置错误
- 配置错误会在日志中记录，并使用默认配置
- 在高并发场景中进行配置热重载时，可能会有短暂的性能影响
- 通过查看日志确认配置已成功应用

### 日志示例

成功加载配置时的日志：

```
[INFO] 工具过滤配置已更改，重新加载工具过滤配置
[INFO] 工具过滤配置已重新加载 {enabled: true, rulesCount: 9, globalIgnore: false}
```

## 调试与验证

在开发规则时，可以使用日志来验证规则是否按预期工作：

1. 将日志级别设置为 `debug`
2. 观察日志中的规则匹配情况
3. 通过日志可以看到哪些规则被触发，哪些工具被过滤

```bash
# 查看详细日志
tail -f logs/status/app.log | grep "工具过滤"
```

## 常见错误

- **规则不生效**：检查操作符是否受支持，正则表达式是否正确
- **字段路径错误**：确保字段路径正确，特别是深层嵌套的字段
- **配置格式错误**：确保JSON格式正确，没有多余或缺少的逗号、括号等
- **性能下降**：检查正则表达式复杂度，考虑启用或优化缓存

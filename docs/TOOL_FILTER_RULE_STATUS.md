# 工具过滤规则状态说明文档

## 概述

本文档详细解释了工具过滤规则的不同状态及其对请求处理的影响。规则状态决定了当规则条件被触发时系统如何响应，包括允许、警告、移除工具或拒绝请求等不同行为。

## 规则动作类型

在 `config/tool-filter-rules.json` 配置文件中，每条规则都有一个 `actions`
对象，定义了规则触发时的行为：

| 动作类型 | 描述           | 系统行为                           | 适用场景                 |
| -------- | -------------- | ---------------------------------- | ------------------------ |
| `allow`  | 允许工具通过   | 规则条件匹配时无动作，工具继续处理 | 白名单规则               |
| `warn`   | 发出警告但允许 | 记录警告日志但不移除工具           | 监控可疑工具但不阻断     |
| `remove` | 移除匹配的工具 | 从请求中删除匹配的工具定义         | 处理不合规但不严重的工具 |
| `reject` | 拒绝整个请求   | 返回错误响应，完全阻止请求         | 严重安全问题             |

## 执行流程

当接收到包含工具的请求时，系统按以下流程处理：

1. 检查 `enabled` 和 `globalIgnore` 全局设置
2. 按规则定义顺序评估每条规则
3. 对每个工具应用匹配规则
4. 根据规则动作执行相应操作
5. 应用 `defaultAction` 处理未匹配任何规则的工具

## 规则触发效果

### 1. 警告（warn）

```json
{
  "name": "tool_naming_convention",
  "description": "检查工具命名是否符合约定",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.name",
      "operator": "not_matches",
      "regex": "^[a-z][a-z0-9_]*$"
    }
  ],
  "actions": {
    "type": "warn"
  }
}
```

**效果**：

- 工具会被保留在请求中
- 系统日志记录警告信息
- 可在管理界面查看警告统计
- 适合监控与调试阶段

### 2. 移除（remove）

```json
{
  "name": "block_dangerous_functions",
  "description": "阻止危险的系统函数",
  "enabled": true,
  "type": "blacklist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(exec|eval|system|shell)"
    }
  ],
  "actions": {
    "type": "remove"
  }
}
```

**效果**：

- 匹配的工具被从请求中删除
- 其他工具正常处理
- 系统日志记录移除操作
- 请求继续处理，不会被完全阻止

### 3. 拒绝（reject）

```json
{
  "name": "security_critical",
  "description": "检测严重安全问题",
  "enabled": true,
  "type": "blacklist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(hack_|exploit_)"
    }
  ],
  "actions": {
    "type": "reject"
  }
}
```

**效果**：

- 整个请求被拒绝，返回 400 错误
- 所有工具都不会被处理
- 系统记录详细拒绝原因
- 客户端收到错误响应

### 4. 允许（allow）

```json
{
  "name": "whitelist_safe_functions",
  "description": "白名单安全函数",
  "enabled": true,
  "type": "whitelist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(get_|read_|display_)"
    }
  ],
  "actions": {
    "type": "allow"
  }
}
```

**效果**：

- 匹配的工具无条件通过
- 不匹配的工具会根据其他规则或默认动作处理
- 适合白名单场景

## 多提供商场景

规则可以针对特定提供商或模型设置：

```json
{
  "name": "provider_specific_rule",
  "description": "针对特定提供商的规则",
  "enabled": true,
  "type": "validation",
  "conditions": [...],
  "actions": {
    "type": "remove"
  },
  "providers": ["openrouter", "ollama"],
  "models": ["gpt-4", "llama3"]
}
```

**效果**：

- 规则只对指定提供商或模型生效
- 其他提供商或模型不受此规则影响
- 可用于针对特定模型的安全限制

## 调试和监控

系统提供以下方式监控规则状态：

1. **日志文件**：根据 `logLevel` 设置记录不同级别的日志信息
2. **日志查询**：通过查看日志文件了解规则触发和配置变更情况
3. **配置热重载**：修改配置文件后自动检测并应用变更

## 规则条件操作符详解与示例

### 1. 字符串匹配操作符

#### matches（正则表达式匹配）

```json
{
  "field": "function.name",
  "operator": "matches",
  "regex": "^get_.*_data$"
}
```

匹配所有以 `get_` 开头、以 `_data` 结尾的函数名称。

#### not_matches（正则表达式不匹配）

```json
{
  "field": "function.description",
  "operator": "not_matches",
  "regex": "\\b(hack|exploit|attack)\\b"
}
```

确保函数描述中不包含 "hack"、"exploit" 或 "attack" 这些敏感词。

#### equals（完全相等）

```json
{
  "field": "function.name",
  "operator": "equals",
  "value": "execute_command"
}
```

精确匹配函数名为 "execute_command" 的工具。

#### not_equals（不等于）

```json
{
  "field": "function.parameters.type",
  "operator": "not_equals",
  "value": "object"
}
```

检查参数类型不是 "object" 的工具。

### 2. 数值比较操作符

#### greater_than（大于）

```json
{
  "field": "function.description.length",
  "operator": "greater_than",
  "value": 500
}
```

检查函数描述长度超过500字符的工具。

#### less_than（小于）

```json
{
  "field": "function.parameters.properties.length",
  "operator": "less_than",
  "value": 2
}
```

检查参数属性数量少于2个的工具。

#### greater_than_or_equal（大于等于）

```json
{
  "field": "function.parameters.required.length",
  "operator": "greater_than_or_equal",
  "value": 1
}
```

确保至少有一个必填参数。

#### less_than_or_equal（小于等于）

```json
{
  "field": "function.name.length",
  "operator": "less_than_or_equal",
  "value": 32
}
```

确保函数名称不超过32个字符。

### 3. 存在性检查操作符

#### exists（字段存在）

```json
{
  "field": "function.parameters.required",
  "operator": "exists"
}
```

检查工具是否定义了必填参数。

#### not_exists（字段不存在）

```json
{
  "field": "function.parameters.additionalProperties",
  "operator": "not_exists"
}
```

检查工具是否未定义额外属性。

### 4. 数组操作符

#### contains（数组包含）

```json
{
  "field": "function.parameters.required",
  "operator": "contains",
  "value": "query"
}
```

检查必填参数中是否包含 "query" 字段。

#### not_contains（数组不包含）

```json
{
  "field": "function.parameters.required",
  "operator": "not_contains",
  "value": "password"
}
```

确保必填参数中不包含 "password" 字段。

## 复杂规则示例

### 1. 多条件规则

同时满足多个条件才触发：

```json
{
  "name": "sensitive_network_functions",
  "description": "检测并阻止敏感的网络操作函数",
  "enabled": true,
  "type": "blacklist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(http|request|fetch)"
    },
    {
      "field": "function.description",
      "operator": "matches",
      "regex": "\\b(external|remote|server)\\b"
    }
  ],
  "actions": {
    "type": "remove"
  }
}
```

此规则会移除名称以 http/request/fetch 开头且描述中包含 external/remote/server 的函数。

### 2. 类型验证规则

验证函数参数的类型定义：

```json
{
  "name": "validate_parameters_schema",
  "description": "验证参数符合正确的JSON Schema格式",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.parameters.properties",
      "operator": "exists"
    },
    {
      "field": "function.parameters.type",
      "operator": "equals",
      "value": "object"
    }
  ],
  "actions": {
    "type": "warn"
  }
}
```

### 3. 函数组合限制

```json
{
  "name": "prevent_dangerous_combinations",
  "description": "防止危险的函数组合出现在同一请求中",
  "enabled": true,
  "type": "custom",
  "conditions": [
    {
      "field": "request.tools.count",
      "operator": "greater_than",
      "value": 1
    },
    {
      "field": "request.tools",
      "operator": "contains_any",
      "values": ["file_write", "system_access"]
    }
  ],
  "actions": {
    "type": "reject"
  }
}
```

此规则会拒绝包含多个工具且其中含有 file_write 或 system_access 工具的请求。

### 4. 针对特定模型的规则

```json
{
  "name": "gpt4_strict_validation",
  "description": "对GPT-4模型应用更严格的工具验证",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.parameters.properties",
      "operator": "not_exists"
    }
  ],
  "action": "remove",
  "models": ["gpt-4", "gpt-4-turbo"]
}
```

## 规则类型使用场景

### 1. 验证型规则（validation）

适用于检查工具格式、完整性和合规性：

```json
{
  "name": "schema_validation",
  "description": "验证工具参数架构是否完整",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.parameters",
      "operator": "exists"
    },
    {
      "field": "function.parameters.properties",
      "operator": "exists"
    },
    {
      "field": "function.parameters.required",
      "operator": "exists"
    }
  ],
  "actions": {
    "type": "warn"
  }
}
```

### 2. 黑名单规则（blacklist）

适用于阻止特定风险工具：

```json
{
  "name": "blacklist_sensitive_operations",
  "description": "阻止敏感操作",
  "enabled": true,
  "type": "blacklist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(admin_|sudo_|root_)"
    }
  ],
  "actions": {
    "type": "remove"
  }
}
```

### 3. 白名单规则（whitelist）

适用于只允许预定义的安全工具：

```json
{
  "name": "whitelist_safe_operations",
  "description": "只允许安全的只读操作",
  "enabled": true,
  "type": "whitelist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(get_|read_|list_|search_)"
    },
    {
      "field": "function.description",
      "operator": "not_matches",
      "regex": "\\b(write|delete|modify|update)\\b"
    }
  ],
  "actions": {
    "type": "allow"
  }
}
```

## 规则动作效果详细说明

### 1. 允许（allow）- 详细效果

- **无条件通过**：即使匹配了其他规则，该工具也会被保留
- **记录日志**：可选择记录低级别日志（trace或debug）
- **优先级**：通常作为白名单规则使用，优先级高于其他规则
- **典型场景**：核心系统功能、经过安全审计的工具

示例：

```json
{
  "name": "trusted_core_functions",
  "description": "信任核心系统功能",
  "enabled": true,
  "type": "whitelist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^core_(log|status|health)"
    }
  ],
  "actions": {
    "type": "allow"
  }
}
```

### 2. 警告（warn）- 详细效果

- **保留工具**：工具会被保留在请求中
- **记录警告**：系统日志记录警告级别（warning）信息
- **统计聚合**：警告次数会被聚合到监控统计中
- **适用场景**：格式不规范但功能安全的工具、新增工具测试期
- **调试应用**：辅助开发者优化工具定义

示例：

```json
{
  "name": "deprecated_parameter_format",
  "description": "检测已弃用的参数格式",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.parameters.additionalProperties",
      "operator": "equals",
      "value": true
    }
  ],
  "actions": {
    "type": "warn"
  }
}
```

### 3. 移除（remove）- 详细效果

- **选择性过滤**：只删除匹配的工具，保留其他工具
- **静默处理**：对客户端透明，不会返回错误
- **日志记录**：记录info级别日志，包含被移除的工具信息
- **性能影响**：几乎不影响整体请求处理性能
- **替代方案**：如果所有工具都被移除，系统仍会处理请求但不包含工具

示例：

```json
{
  "name": "remove_unvalidated_tools",
  "description": "移除未经验证的工具",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.description",
      "operator": "not_exists"
    },
    {
      "field": "function.description.length",
      "operator": "less_than",
      "value": 10
    }
  ],
  "actions": {
    "type": "remove"
  }
}
```

### 4. 拒绝（reject）- 详细效果

- **完全阻断**：整个请求被拒绝，返回HTTP 400错误
- **错误消息**：向客户端返回详细错误原因
- **审计记录**：记录错误级别（error）日志，包含完整请求信息
- **通知选项**：可配置触发系统通知或告警
- **零容忍**：用于严重安全问题，不允许任何例外

示例：

```json
{
  "name": "security_critical_functions",
  "description": "禁止严重的安全风险函数",
  "enabled": true,
  "type": "blacklist",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(sql_|db_query|raw_query|execute_sql)"
    },
    {
      "field": "function.description",
      "operator": "matches",
      "regex": "\\b(sql injection|direct query|raw sql)\\b"
    }
  ],
  "actions": {
    "type": "reject"
  },
  "errorMessage": "SQL查询类工具被禁止使用，请使用安全参数化接口"
}
```

## 常见规则状态问题

### 1. 规则未生效

可能原因：

- 检查 `enabled` 是否为 `true`
- 检查 `globalIgnore` 是否为 `false`
- 条件表达式可能有语法错误
- 规则顺序可能影响其执行
- 特定提供商或模型限制未匹配
- 字段路径不正确（区分大小写）
- 正则表达式语法错误

### 2. 工具被意外移除

可能原因：

- 多条规则重叠影响
- 正则表达式匹配过于宽泛
- 默认动作设置不当
- 字段路径层次不清晰
- 错误的操作符使用
- 白名单规则失效
- 缓存问题导致使用了旧规则

### 3. 性能下降

可能原因：

- 规则过多，优化数量
- 复杂正则表达式，简化���配条件
- 缓存设置不当，调整缓存参数
- 嵌套深层字段查询过多
- 多个正则表达式规则连续使用
- 规则顺序不合理（高频触发规则放前面）

## 最佳实践

1. **优先级排序**：重要规则放在前面
2. **定期审计**：检查规则触发日志和统计
3. **渐进式部署**：新规则先设为 `warn` 再升级为 `remove` 或 `reject`
4. **细分规则**：每条规则职责单一，便于维护
5. **缓存优化**：根据实际负载调整缓存参数

## 紧急响应

在生产环境遇到问题时可以使用以下方案快速响应：

1. 使用 `globalIgnore: true` 临时禁用所有规则
2. 通过 API 重新加载配置，无需重启服务
3. 查看详细日志分析原因
4. 修复规则后恢复正常配置

通过合理设置规则状态，可以实现既灵活又安全的工具过滤策略。

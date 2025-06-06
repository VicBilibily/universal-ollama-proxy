# 工具过滤功能使用指南

## 概述

工具过滤功能是一个强大的安全和兼容性系统，允许你自动验证、修复和过滤传入的工具定义，确保它们符合模型能力和安全要求。该功能具有以下核心能力：

- 🛡️ **安全防护**: 自动验证和过滤工具定义，阻止危险函数调用
- ✅ **格式修复**: 自动修复工具结构，补全缺失的必要字段
- 🔧 **兼容性增强**: 为特定模型（如Anthropic）提供兼容性支持
- 🚫 **规则引擎**: 支持复杂的条件匹配和动作执行
- ⚡ **性能优化**: 内置缓存机制，提高过滤性能
- 🔄 **配置热重载**: 支持配置文件热重载，无需重启服务
- 📝 **详细日志**: 多级别日志记录，便于调试和监控

## 配置文件

工具过滤配置文件位于
`config/tool-filter-rules.json`，采用 JSON 格式并支持注释和尾随逗号。配置文件包含以下主要部分：

```json
{
  // 基本开关
  "enabled": true,
  "globalIgnore": false,

  // 过滤规则
  "rules": [
    {
      "name": "complete_missing_parameters",
      "description": "为缺少parameters的工具补全空参数对象",
      "enabled": true,
      "conditions": {
        "providers": ["openrouter"],
        "models": ["anthropic/*"],
        "toolPattern": ".*"
      },
      "actions": {
        "type": "transform",
        "transform": "complete_parameters"
      }
    }
  ],

  // 默认行为和性能设置
  "defaultAction": "allow",
  "logLevel": "debug",
  "performance": {
    "enableCache": true,
    "cacheExpiration": 300,
    "maxCacheEntries": 1000
  }
}
```

### 配置选项说明

#### 基本开关

- **enabled**: 是否启用工具过滤功能
- **globalIgnore**: 全局忽略开关（紧急情况下快速禁用所有过滤）

#### 规则配置

- **rules**: 过滤规则数组，支持复杂的条件匹配和动作执行
- **defaultAction**: 当没有规则匹配时的默认行为（`allow` 或 `deny`）

#### 日志和性能

- **logLevel**: 日志级别（`none`, `warn`, `info`, `debug`）
- **performance**: 性能相关设置
  - `enableCache`: 是否启用缓存
  - `cacheExpiration`: 缓存过期时间（秒）
  - `maxCacheEntries`: 最大缓存条目数

## 核心功能

### 1. 工具格式验证和修复

系统会自动验证工具结构的完整性，并尝试修复常见问题：

- **类型字段修复**: 自动添加或修正 `type: "function"` 字段
- **参数补全**: 为缺少 `parameters` 的工具添加空参数对象
- **必需字段检查**: 验证 `function.name` 等必需字段的存在
- **参数结构修复**: 自动添加缺失的 `required` 数组

### 2. 兼容性增强

为不同模型提供兼容性支持：

#### 参数补全

```json
{
  "actions": {
    "type": "transform",
    "transform": "complete_parameters"
  }
}
```

- 为缺少 `parameters` 字段的工具补全空参数对象
- 避免因参数缺失导致的工具调用失败

### 3. 安全过滤

通过规则引擎实现安全控制：

- **条件匹配**: 支持字段存在性、内容匹配、正则表达式等
- **动作执行**: 移除、警告或转换工具
- **优先级控制**: 通过 `priority` 字段控制规则执行顺序

## 规则配置详解

### 规则结构

工具过滤支持两种规则条件格式：对象格式和数组格式。

#### 对象格式（简单匹配）

```json
{
  "name": "complete_missing_parameters",
  "description": "为OpenRouter的Anthropic模型补全缺失的工具参数",
  "enabled": true,
  "conditions": {
    "providers": ["openrouter"],
    "models": ["anthropic/*"],
    "toolPattern": ".*"
  },
  "actions": {
    "type": "transform",
    "transform": "complete_parameters"
  },
  "priority": 300,
  "logLevel": "info"
}
```

#### 数组格式（详细条件）

```json
{
  "name": "block_dangerous_functions",
  "description": "阻止危险的系统函数调用",
  "enabled": true,
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(exec|eval|system|shell)"
    }
  ],
  "actions": {
    "type": "remove"
  },
  "priority": 100
}
```

    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(exec|eval|system|shell)"
    }

], "action": "remove", "priority": 100 }

````

### 条件匹配

#### 对象条件格式
- **providers**: 应用的提供商列表，支持通配符
- **models**: 应用的模型列表，支持通配符（如 `anthropic/*`）
- **toolPattern**: 工具名称匹配的正则表达式

#### 数组条件格式
支持详细的字段条件匹配：

```json
"conditions": [
  {
    "field": "function.parameters",
    "operator": "not_exists"
  },
  {
    "field": "function.name",
    "operator": "contains",
    "value": "dangerous"
  }
]
````

支持的操作符：

- `exists` / `not_exists`: 字段存在性检查
- `equals` / `not_equals`: 值相等性检查
- `contains` / `not_contains`: 字符串包含检查
- `matches`: 正则表达式匹配

### 动作执行

#### 动作格式

```json
"actions": {
  "type": "transform|remove|warn",
  "transform": "转换类型（可选）"
}
```

支持的动作类型：

- **transform**: 转换工具格式
- **remove**: 移除工具
- **warn**: 发出警告但保留工具

## 配置管理方式

### 文件配置热重载机制

工具过滤配置通过文件系统管理。系统采用热重载机制，当配置文件发生变更时会自动检测并重新加载，无需重启服务。

#### 工作流程

1. 修改 `config/tool-filter-rules.json` 配置文件
2. 系统自动检测文件变更并重新加载配置
3. 日志系统记录配置变更情况和统计信息
4. 新配置立即生效，应用于后续请求

#### 示例配置文件

```json
{
  "enabled": true,
  "globalIgnore": false,
  "rules": [
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
      "action": "remove"
    }
  ],
  "defaultAction": "allow",
  "logLevel": "warn",
  "performance": {
    "enableCache": true,
    "cacheExpiration": 300,
    "maxCacheEntries": 1000
  }
}
```

### 监控与调试

通过日志系统可以监控配置变更和工具过滤情况：

```bash
# 查看配置变更日志
Get-Content -Path .\logs\status\app.log -Tail 20 | Select-String "工具过滤配置"

# 查看过滤规则匹配情况
Get-Content -Path .\logs\status\app.log -Tail 50 | Select-String "工具过滤"
```

### 紧急配置

在紧急情况下可以通过修改配置文件停用过滤：

```json
{
  "enabled": false
}
```

或者使用全局忽略开关：

```json
{
  "globalIgnore": true
}
```

## 自定义规则

你可以创建自定义规则来满足特定需求：

```json
{
  "name": "custom_rule",
  "description": "自定义规则描述",
  "enabled": true,
  "type": "validation",
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^allowed_prefix_.*"
    }
  ],
  "action": "remove",
  "providers": ["specific-provider"],
  "models": ["specific-model"]
}
```

### 规则类型

- **blacklist**: 黑名单规则
- **whitelist**: 白名单规则
- **pattern**: 模式匹配规则
- **validation**: 验证规则

### 操作符

- **equals**: 等于
- **not_equals**: 不等于
- **contains**: 包含
- **not_contains**: 不包含
- **matches**: 正则匹配
- **exists**: 存在
- **not_exists**: 不存在

### 动作

- **remove**: 移除工具
- **reject**: 拒绝请求
- **warn**: 发出警告
- **transform**: 转换工具格式

### 转换类型

- **complete_parameters**: 补全缺失的参数对象

## 使用场景

### 1. 补全 OpenRouter Anthropic 模型的工具参数

OpenRouter 的 Anthropic 模型需要工具定义中包含 parameters 字段，即使是空的参数对象：

```json
{
  "name": "complete_missing_parameters",
  "description": "当工具的 function.parameters 不存在时，补全为空参数对象",
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
  }
}
```

更多详情请查看
[OpenRouter Anthropic 工具过滤配置](OPENROUTER_ANTHROPIC_TOOL_FILTER.md)。

### 2. 开发环境

在开发环境中，你可能希望允许所有工具以便于测试：

```json
{
  "enabled": false
}
```

### 2. 生产环境

在生产环境中，启用严格的安全规则：

```json
{
  "enabled": true,
  "globalIgnore": false,
  "defaultAction": "deny",
  "logLevel": "info"
}
```

### 3. 特定提供商限制

为特定提供商设置特殊规则：

```json
{
  "name": "provider_specific_rule",
  "providers": ["provider-name"],
  "conditions": [...],
  "action": "remove"
}
```

## 性能优化

### 缓存配置

```json
{
  "performance": {
    "enableCache": true,
    "cacheExpiration": 600,
    "maxCacheEntries": 2000
  }
}
```

### 日志级别

- **none**: 不记录日志
- **warn**: 只记录警告
- **info**: 记录信息和警告
- **debug**: 记录所有详细信息

## 故障排除

### 1. 工具被意外移除

检查日志以查看触发的规则：

```bash
# 查看日志
tail -f logs/status/app.log | grep "工具过滤"
```

### 2. 性能问题

- 启用缓存
- 调整缓存大小
- 优化规则数量

### 3. 紧急情况

通过修改配置文件，启用全局忽略开关：

```json
{
  "globalIgnore": true
}
```

编辑后保存文件，配置将自动重新加载。

## 最佳实践

1. **渐进式部署**: 先在测试环境验证规则
2. **监控日志**: 定期检查过滤日志
3. **备份配置**: 保存配置文件的备份
4. **性能监控**: 监控缓存命中率和响应时间
5. **安全优先**: 默认采用保守的安全规则

## 示例配置

### 基础安全配置

```json
{
  "enabled": true,
  "globalIgnore": false,
  "rules": [
    {
      "name": "require_function_name",
      "enabled": true,
      "type": "validation",
      "conditions": [{ "field": "function.name", "operator": "exists" }],
      "action": "remove"
    },
    {
      "name": "block_dangerous_functions",
      "enabled": true,
      "type": "blacklist",
      "conditions": [
        {
          "field": "function.name",
          "operator": "matches",
          "regex": "^(exec|eval|system|shell)"
        }
      ],
      "action": "remove"
    }
  ],
  "defaultAction": "allow",
  "logLevel": "warn"
}
```

### 高安全性配置

```json
{
  "enabled": true,
  "globalIgnore": false,
  "rules": [
    {
      "name": "strict_whitelist",
      "enabled": true,
      "type": "whitelist",
      "conditions": [
        {
          "field": "function.name",
          "operator": "matches",
          "regex": "^(get_|fetch_|calculate_|format_)"
        }
      ],
      "action": "remove"
    }
  ],
  "defaultAction": "deny",
  "logLevel": "info"
}
```

## 使用示例

### 示例1：为Anthropic模型补全参数

```json
{
  "name": "anthropic_parameter_completion",
  "description": "为OpenRouter的Anthropic模型自动补全缺失的工具参数",
  "enabled": true,
  "conditions": {
    "providers": ["openrouter"],
    "models": ["anthropic/*"]
  },
  "actions": {
    "type": "transform",
    "transform": "complete_parameters"
  },
  "priority": 300,
  "logLevel": "info"
}
```

### 示例2：阻止危险函数调用

```json
{
  "name": "block_system_functions",
  "description": "阻止执行系统命令的危险函数",
  "enabled": true,
  "conditions": [
    {
      "field": "function.name",
      "operator": "matches",
      "regex": "^(exec|eval|system|shell|subprocess)"
    }
  ],
  "action": "remove",
  "priority": 100,
  "logLevel": "warn"
}
```

### 示例3：文件操作警告

```json
{
  "name": "warn_file_operations",
  "description": "对文件操作函数发出警告",
  "enabled": true,
  "conditions": [
    {
      "field": "function.name",
      "operator": "contains",
      "value": "file"
    }
  ],
  "action": "warn",
  "priority": 50
}
```

## 配置管理

### 热重载机制

工具过滤配置支持热重载，修改配置文件后无需重启服务：

1. 编辑 `config/tool-filter-rules.json` 文件
2. 保存文件后系统自动检测变更
3. 配置在1秒防抖延迟后自动重新加载
4. 新配置立即生效，应用于后续请求

### 配置验证

系统会自动验证配置文件的语法和逻辑：

- **JSON语法检查**: 确保配置文件格式正确
- **字段验证**: 检查必需字段和数据类型
- **规则冲突检测**: 识别可能的规则冲突
- **性能影响评估**: 警告可能影响性能的配置

## 监控和调试

### 日志级别

- **none**: 不输出日志
- **warn**: 只输出警告和错误
- **info**: 输出基本信息和警告
- **debug**: 输出详细的调试信息

### 调试技巧

1. **启用详细日志**: 设置 `logLevel: "debug"` 查看详细处理过程
2. **使用工具验证**: 调用 `/api/tools/validate` 端点测试工具格式
3. **检查缓存统计**: 查看缓存命中率和性能数据
4. **监控触发规则**: 观察哪些规则被触发以及频率

### 性能监控

- **缓存命中率**: 监控缓存效果
- **处理延迟**: 测量过滤处理时间
- **规则触发频率**: 统计各规则的使用情况
- **内存使用**: 监控缓存内存占用

## 故障排除

### 常见问题

1. **规则不生效**

   - 检查 `enabled` 字段是否为 `true`
   - 验证条件匹配逻辑
   - 确认提供商和模型匹配

2. **工具被意外移除**

   - 检查规则优先级设置
   - 验证正则表达式匹配范围
   - 查看详细日志确定触发规则

3. **性能问题**
   - 调整缓存设置
   - 优化正则表达式复杂度
   - 减少不必要的规则

### 最佳实践

1. **规则设计**

   - 使用有意义的规则名称
   - 提供清晰的描述信息
   - 合理设置优先级

2. **性能优化**

   - 启用缓存功能
   - 避免过于复杂的正则表达式
   - 将常用规则设置更高优先级

3. **安全考虑**

   - 定期审查过滤规则
   - 测试新规则的影响范围
   - 保持规则的最小权限原则

4. **维护管理**
   - 定期清理无用规则
   - 备份重要配置
   - 监控规则执行效果

## 相关文档

- [工具过滤配置注意事项](./TOOL_FILTER_CONFIG_NOTES.md)
- [OpenRouter Anthropic工具过滤](./OPENROUTER_ANTHROPIC_TOOL_FILTER.md)
- [工具过滤规则状态](./TOOL_FILTER_RULE_STATUS.md)
- [配置热重载说明](./CONFIG_HOT_RELOAD.md)

---

_本文档随项目更新而更新，请关注最新版本。_

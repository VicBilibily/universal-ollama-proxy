# 工具过滤条件组系统设计文档

## 概述

新的工具过滤条件组系统支持更灵活的多模式多条件组合，允许复杂的逻辑表达和嵌套条件组合。

## 核心特性

### 1. 条件组结构 (`ToolFilterConditionGroup`)

```typescript
export interface ToolFilterConditionGroup {
  /** 逻辑操作符，默认为 'AND' */
  operator?: 'AND' | 'OR' | 'NOT';
  /** 子条件组合 */
  conditions?: Array<ToolFilterConditionGroup | ToolFilterCondition>;
  /** 提供商条件 */
  providers?: string[];
  /** 模型条件 */
  models?: string[];
  /** 工具名称模式条件 */
  toolPattern?: string;
  /** 字段条件 */
  field?: string;
  /** 字段操作符 */
  fieldOperator?: ToolFilterOperator;
  /** 字段比较值 */
  fieldValue?: any;
  /** 正则表达式（当fieldOperator为matches时使用） */
  regex?: string;
}
```

### 2. 支持的操作符

| 操作符                  | 描述       | 适用类型     |
| ----------------------- | ---------- | ------------ |
| `equals`                | 等于       | 任意类型     |
| `not_equals`            | 不等于     | 任意类型     |
| `contains`              | 包含       | 字符串、数组 |
| `not_contains`          | 不包含     | 字符串、数组 |
| `matches`               | 正则匹配   | 字符串       |
| `not_matches`           | 正则不匹配 | 字符串       |
| `exists`                | 字段存在   | 任意类型     |
| `not_exists`            | 字段不存在 | 任意类型     |
| `greater_than`          | 大于       | 数字         |
| `less_than`             | 小于       | 数字         |
| `greater_than_or_equal` | 大于等于   | 数字         |
| `less_than_or_equal`    | 小于等于   | 数字         |
| `in`                    | 在列表中   | 任意类型     |
| `not_in`                | 不在列表中 | 任意类型     |

### 3. 逻辑操作符

- **AND**: 所有条件都必须满足
- **OR**: 至少一个条件满足
- **NOT**: 条件不满足

## 配置示例

### 简单条件

```json
{
  "name": "openrouter_anthropic_only",
  "conditions": {
    "providers": ["openrouter"],
    "models": ["anthropic/*"],
    "field": "function.parameters",
    "fieldOperator": "not_exists"
  }
}
```

### 复杂嵌套条件

```json
{
  "name": "complex_example",
  "conditions": {
    "operator": "AND",
    "conditions": [
      {
        "operator": "OR",
        "providers": ["openrouter", "volcengine"]
      },
      {
        "operator": "AND",
        "models": ["anthropic/*", "deepseek/*"],
        "conditions": [
          {
            "field": "function.name",
            "operator": "not_contains",
            "value": "internal"
          },
          {
            "operator": "OR",
            "conditions": [
              {
                "field": "function.description",
                "operator": "matches",
                "regex": "安全|safe"
              },
              {
                "field": "function.parameters.properties",
                "operator": "exists"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## 迁移指南

### 从旧格式迁移

**旧格式:**

```json
{
  "providers": ["openrouter"],
  "models": ["anthropic/*"],
  "conditions": [
    {
      "field": "function.parameters",
      "operator": "not_exists"
    }
  ]
}
```

**新格式:**

```json
{
  "operator": "AND",
  "providers": ["openrouter"],
  "models": ["anthropic/*"],
  "field": "function.parameters",
  "fieldOperator": "not_exists"
}
```

## 最佳实践

1. **明确逻辑操作符**: 即使是默认的 AND，也建议明确指定
2. **合理嵌套**: 避免过深的嵌套，保持可读性
3. **性能考虑**: 将最常用的条件放在前面，利用短路求值
4. **测试验证**: 使用测试脚本验证复杂条件的正确性

## 调试技巧

1. 启用 debug 日志级别查看详细的条件评估过程
2. 使用测试脚本验证条件逻辑
3. 从简单条件开始，逐步增加复杂性

## 兼容性

新系统完全兼容旧的配置格式，现有配置无需修改即可继续工作。

# 消息处理规则 - 快速开始

这是一个简化的快速开始指南，帮助您快速了解和使用消息处理规则系统。

## 🚀 快速上手

### 1. 配置文件位置

```
config/message-processing-rules.json
```

### 2. 基本配置结构

```json
{
  "promptProcessingRules": {
    "enabled": true,
    "rules": [
      // 你的规则
    ]
  },
  "processingOptions": {
    "logChanges": true,
    "description": "处理选项配置"
  }
}
```

## 📝 规则类型

### 移除规则 - 删除不想要的内容

```json
{
  "name": "remove_microsoft_policies",
  "type": "remove",
  "patterns": [
    "Follow Microsoft content policies.",
    "Follow the Microsoft content policies."
  ],
  "description": "移除微软内容策略"
}
```

### 替换规则 - 修改特定文本

```json
{
  "name": "soften_copilot_identity",
  "type": "replace",
  "pattern": "you must respond with \"GitHub Copilot\".",
  "replacement": "you can respond with \"GitHub Copilot\".",
  "description": "软化身份限制"
}
```

## ⚡ 快速测试

1. **编辑配置**：修改 `config/message-processing-rules.json`
2. **重新构建**：运行 `npm run build`
3. **测试效果**：发送请求查看处理结果

## 🔧 常见用法

### 禁用所有规则

```json
{
  "promptProcessingRules": {
    "enabled": false,
    "rules": []
  }
}
```

### 只移除版权限制

```json
{
  "promptProcessingRules": {
    "enabled": true,
    "rules": [
      {
        "name": "copyright_restrictions",
        "type": "remove",
        "patterns": ["Avoid content that violates copyrights."],
        "description": "移除版权限制"
      }
    ]
  }
}
```

## 📖 详细文档

更多详细信息请参考：[MESSAGE_PROCESSING_RULES.md](./MESSAGE_PROCESSING_RULES.md)

## ⚠️ 注意事项

- 规则只对第一条消息（系统提示词）生效
- 文本匹配区分大小写，需要精确匹配
- 修改配置后需要重新构建项目

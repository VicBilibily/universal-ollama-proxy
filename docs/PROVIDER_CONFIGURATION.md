# 提供商配置指南

本文档介绍了如何在 Universal Ollama
Proxy 中配置AI服务提供商。特别关注提供商的 API 密钥配置方式及其对模型可用性的影响。

## 提供商配置文件

提供商配置位于 `config/unified-providers.json`
文件中，该文件定义了所有支持的AI服务提供商及其连接设置。

### 基本结构

```json
{
  "providers": [
    {
      "name": "providerName",
      "displayName": "Provider Display Name",
      "baseURL": "https://api.provider.com/v1",
      "apiKey": "...", // API密钥配置
      "headers": {
        "Content-Type": "application/json"
        // 可能的其他请求头
      }
    }
  ],
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2025-06-05",
    "description": "AI服务供应商配置文件"
  }
}
```

## API密钥配置方式

系统支持三种不同的API密钥配置方式，每种方式适用于不同的场景：

### 1. 环境变量引用（推荐）

通过引用环境变量来设置API密钥，这是最安全的方式，适合生产环境：

```json
"apiKey": "${ENV_VARIABLE_NAME}"
```

例如：

```json
"apiKey": "${OPENAI_API_KEY}"
```

当应用启动时，将从环境变量 `OPENAI_API_KEY`
读取实际的API密钥。如果环境变量未设置，该提供商将被标记为不可用，其模型不会出现在可用模型列表中。

### 2. 配置密钥

直接在配置文件中设置API密钥，适合开发或测试环境：

```json
"apiKey": "sk-your-actual-api-key-here"
```

**注意**：这种方式不推荐用于生产环境，因为它会将密钥硬编码到配置文件中，存在安全风险。

### 3. 无需认证

对于不需要API密钥的服务（如某些公共API或本地服务），可以设置为空字符串：

```json
"apiKey": ""
```

这种配置表明该提供商不需要认证，服务将正常初始化，其模型将出现在可用模型列表中。

## API密钥与模型可用性

系统会根据API密钥的配置和有效性判断提供商的可用状态：

1. **有效的API密钥**：如果提供商配置了有效的API密钥（无论是通过环境变量还是配置密钥方式），该提供商的所有模型将被加载并显示在可用模型列表中。

2. **无需认证**：如果提供商配置为不需要认证（空API密钥），该提供商的所有模型也将被加载并显示在可用模型列表中。

3. **无效或缺失的API密钥**：如果提供商需要API密钥但未提供或提供的密钥无效（例如，引用了未设置的环境变量），该提供商将被标记为不可用，其模型将不会出现在可用模型列表中。

这种机制确保了用户只能看到并使用那些实际可访问的模型，避免在尝试使用未授权服务时遇到错误。

## 提供商配置示例

以下是一些常见提供商配置示例：

### 环境变量方式（推荐）

```json
{
  "name": "openai",
  "displayName": "OpenAI",
  "baseURL": "https://api.openai.com/v1",
  "apiKey": "${OPENAI_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 本地Ollama服务（无需认证）

```json
{
  "name": "ollama",
  "displayName": "本地Ollama",
  "baseURL": "http://localhost:11434/api",
  "apiKey": "",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

## 配置更新与热重载

配置文件支持热重载，这意味着您可以在不重启应用的情况下更改提供商配置。当配置文件被修改后，系统会：

1. 重新加载提供商配置
2. 重新验证API密钥
3. 更新可用提供商列表
4. 更新可见的模型列表

这使您可以动态添加、移除或修改提供商，而无需中断服务。

## 故障排除

如果某个提供商的模型没有出现在可用模型列表中，请检查以下几点：

1. 确认API密钥配置正确
2. 如果使用环境变量，确认环境变量已正确设置
3. 检查应用日志，查找可能的API密钥验证错误
4. 确认该提供商的模型配置文件（`config/{provider-name}-models.json`）存在且格式正确

## 安全最佳实践

为确保API密钥的安全，建议遵循以下最佳实践：

1. 始终优先使用环境变量方式存储API密钥
2. 避免将实际API密钥提交到版本控制系统
3. 在生产环境中，考虑使用密钥管理服务
4. 定期轮换API密钥
5. 对API密钥设置适当的权限范围，遵循最小权限原则

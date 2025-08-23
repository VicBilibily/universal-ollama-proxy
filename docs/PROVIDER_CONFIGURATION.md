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
      "enabled": true, // 可选，设置为false可临时停用该提供商
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
    "lastUpdated": "2025-06-06",
    "description": "AI服务供应商配置文件"
  }
}
```

### 字段说明

- **name**: 提供商的唯一标识符，用于内部识别
- **displayName**: 提供商的显示名称，用于用户界面展示
- **enabled**: 可选字段，默认为 `true`。设置为 `false`
  可临时停用该提供商而不删除配置
- **baseURL**: 提供商的API基础URL
- **apiKey**: API密钥配置，支持环境变量引用、直接配置或空值
- **headers**: 可选的自定义请求头，会与默认请求头合并

## 提供商启用/禁用控制

系统支持动态控制提供商的启用状态，通过 `enabled`
字段可以临时停用提供商而不删除其配置：

### 启用提供商（默认）

```json
{
  "name": "openai",
  "displayName": "OpenAI",
  "enabled": true, // 明确启用
  "baseURL": "https://api.openai.com/v1",
  "apiKey": "${OPENAI_API_KEY}"
}
```

当 `enabled` 字段为 `true` 或未设置时，提供商将正常初始化。

### 禁用提供商

```json
{
  "name": "openai",
  "displayName": "OpenAI",
  "enabled": false, // 临时禁用
  "baseURL": "https://api.openai.com/v1",
  "apiKey": "${OPENAI_API_KEY}"
}
```

当 `enabled` 字段设置为 `false` 时：

- 该提供商不会被初始化
- 其模型不会出现在可用模型列表中
- 配置信息得以保留，方便后续重新启用

这个功能在以下场景中非常有用：

- **临时禁用**：在维护期间暂时停用某个提供商
- **开发测试**：在开发环境中只启用部分提供商
- **成本控制**：临时停用付费提供商以控制成本
- **故障排除**：逐个启用提供商来排查问题

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

## 支持的提供商

系统当前支持以下AI服务提供商：

### 1. 火山方舟引擎 (Volcengine)

- **提供商**: 字节跳动
- **配置名**: `volcengine`
- **环境变量**: `VOLCENGINE_API_KEY`
- **模型配置**: `config/volcengine-models.json`

```json
{
  "name": "volcengine",
  "displayName": "火山方舟引擎",
  "enabled": true,
  "baseURL": "https://ark.cn-beijing.volces.com/api/v3",
  "apiKey": "${VOLCENGINE_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 2. 阿里云百炼 (DashScope)

- **提供商**: 阿里云
- **配置名**: `dashscope`
- **环境变量**: `DASHSCOPE_API_KEY`
- **模型配置**: `config/dashscope-models.json`

```json
{
  "name": "dashscope",
  "displayName": "阿里云百炼",
  "enabled": true,
  "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "${DASHSCOPE_API_KEY}",
  "headers": {
    "Content-Type": "application/json",
    "X-DashScope-SSE": "enable"
  }
}
```

### 3. DeepSeek 官方

- **提供商**: DeepSeek
- **配置名**: `deepseek`
- **环境变量**: `DEEPSEEK_API_KEY`
- **模型配置**: `config/deepseek-models.json`

```json
{
  "name": "deepseek",
  "displayName": "DeepSeek官方",
  "enabled": true,
  "baseURL": "https://api.deepseek.com/v1",
  "apiKey": "${DEEPSEEK_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 4. 腾讯云 DeepSeek

- **提供商**: 腾讯云
- **配置名**: `tencentds`
- **环境变量**: `TENCENTDS_API_KEY`
- **模型配置**: `config/tencentds-models.json`

```json
{
  "name": "tencentds",
  "displayName": "腾讯云DeepSeek",
  "enabled": true,
  "baseURL": "https://api.lkeap.cloud.tencent.com/v1",
  "apiKey": "${TENCENTDS_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 5. OpenRouter

- **提供商**: OpenRouter AI
- **配置名**: `openrouter`
- **环境变量**: `OPENROUTER_API_KEY`
- **模型配置**: `config/openrouter-models.json`

```json
{
  "name": "openrouter",
  "displayName": "OpenRouter",
  "enabled": true,
  "baseURL": "https://openrouter.ai/api/v1",
  "apiKey": "${OPENROUTER_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 7. 魔搭社区 (ModelScope)

- **提供商**: 阿里云
- **配置名**: `modelscope`
- **环境变量**: `MODELSCOPE_API_KEY`
- **模型配置**: `config/modelscope-models.json`

**⚠️ 重要提示：账号绑定要求**

使用魔搭社区API前，**必须**完成以下步骤：

1. **注册魔搭社区账号**：访问 [ModelScope官网](https://modelscope.cn/) 注册账号
2. **绑定阿里云账号**：在魔搭社区个人中心绑定阿里云账号
3. **获取API密钥**：在个人设置中获取API Token

> **注意**：如果未绑定阿里云账号直接调用API，会收到 `401 Unauthorized`
> 错误。绑定阿里云账号是使用魔搭社区API服务的必要条件。

```json
{
  "name": "modelscope",
  "displayName": "魔搭社区",
  "enabled": true,
  "baseURL": "https://api-inference.modelscope.cn/v1",
  "apiKey": "${MODELSCOPE_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 8. 智谱AI BigModel

- **提供商**: 智谱AI
- **配置名**: `bigmodel`
- **环境变量**: `BIGMODEL_API_KEY`
- **模型配置**: `config/bigmodel-models.json`

```json
{
  "name": "bigmodel",
  "displayName": "智谱AI BigModel",
  "enabled": true,
  "baseURL": "https://open.bigmodel.cn/api/paas/v4",
  "apiKey": "${BIGMODEL_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

## 提供商配置示例

以下是一些常见提供商配置示例：

### 环境变量配置示例

```json
{
  "name": "openai",
  "displayName": "OpenAI",
  "enabled": true,
  "baseURL": "https://api.openai.com/v1",
  "apiKey": "${OPENAI_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 本地服务配置示例（无需认证）

```json
{
  "name": "ollama",
  "displayName": "本地Ollama",
  "enabled": true,
  "baseURL": "http://localhost:11434/v1",
  "apiKey": "",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 临时禁用的提供商示例

```json
{
  "name": "expensive_provider",
  "displayName": "昂贵的AI服务",
  "enabled": false, // 临时禁用以控制成本
  "baseURL": "https://api.expensive-ai.com/v1",
  "apiKey": "${EXPENSIVE_API_KEY}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

## 环境变量设置指南

### Windows PowerShell

```powershell
# 设置环境变量
$env:OPENAI_API_KEY = "sk-your-openai-key"
$env:DEEPSEEK_API_KEY = "sk-your-deepseek-key"
$env:DASHSCOPE_API_KEY = "sk-your-dashscope-key"

# 验证环境变量
echo $env:OPENAI_API_KEY
```

### Windows CMD

```cmd
set OPENAI_API_KEY=sk-your-openai-key
set DEEPSEEK_API_KEY=sk-your-deepseek-key
set DASHSCOPE_API_KEY=sk-your-dashscope-key
```

### Linux/macOS

```bash
# 临时设置
export OPENAI_API_KEY="sk-your-openai-key"
export DEEPSEEK_API_KEY="sk-your-deepseek-key"
export DASHSCOPE_API_KEY="sk-your-dashscope-key"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export OPENAI_API_KEY="sk-your-openai-key"' >> ~/.bashrc
```

### Docker 环境

```yaml
# docker-compose.yml
version: '3.8'
services:
  universal-ollama-proxy:
    image: universal-ollama-proxy
    environment:
      - OPENAI_API_KEY=sk-your-openai-key
      - DEEPSEEK_API_KEY=sk-your-deepseek-key
      - DASHSCOPE_API_KEY=sk-your-dashscope-key
```

## 故障排除

### 常见问题诊断

#### 1. 提供商模型不显示

**症状**: 某个提供商的模型没有出现在可用模型列表中

**可能原因及解决方案**:

- **API密钥未配置**: 检查环境变量是否正确设置
- **提供商被禁用**: 确认配置中 `enabled` 字段不是 `false`
- **模型配置文件缺失**: 确认 `config/{provider-name}-models.json` 文件存在
- **网络连接问题**: 检查提供商的 `baseURL` 是否可访问

#### 2. 环境变量未生效

**症状**: 使用 `${ENV_VAR}` 格式但提示API密钥无效

**解决步骤**:

1. 确认环境变量名称拼写正确
2. 重启应用以加载新的环境变量
3. 运行配置检查验证环境变量
   ```bash
   npm run check
   ```

#### 3. 提供商初始化失败

**症状**: 日志显示提供商初始化错误

**检查步骤**:

1. 验证 `baseURL` 格式是否正确
2. 检查API密钥格式是否符合提供商要求
3. 确认网络防火墙没有阻止访问
4. 查看详细错误日志获取更多信息

### 日志检查

运行系统检查查看详细的错误信息：

```bash
# 运行完整系统诊断
npm run check

# 启用详细调试日志
LOG_LEVEL=debug npm run dev
```

### 配置验证

运行配置验证命令验证配置文件格式：

```bash
# 运行完整配置验证
npm run check

# 验证配置文件格式
npm run check
```

## 配置更新与热重载

配置文件支持热重载，这意味着您可以在不重启应用的情况下更改提供商配置。当配置文件被修改后，系统会：

1. 重新加载提供商配置
2. 重新验证API密钥
3. 更新可用提供商列表
4. 更新可见的模型列表

这使您可以动态添加、移除或修改提供商，而无需中断服务。

## 故障排除

### 配置最佳实践

#### 开发环境配置示例

```json
{
  "providers": [
    {
      "name": "local_ollama",
      "displayName": "本地测试",
      "enabled": true,
      "baseURL": "http://localhost:11434/v1",
      "apiKey": ""
    },
    {
      "name": "openai",
      "displayName": "OpenAI",
      "enabled": false, // 开发时禁用付费服务
      "baseURL": "https://api.openai.com/v1",
      "apiKey": "${OPENAI_API_KEY}"
    }
  ]
}
```

#### 生产环境配置示例

```json
{
  "providers": [
    {
      "name": "volcengine",
      "displayName": "火山方舟引擎",
      "enabled": true,
      "baseURL": "https://ark.cn-beijing.volces.com/api/v3",
      "apiKey": "${VOLCENGINE_API_KEY}"
    },
    {
      "name": "dashscope",
      "displayName": "阿里云百炼",
      "enabled": true,
      "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "${DASHSCOPE_API_KEY}",
      "headers": {
        "X-DashScope-SSE": "enable"
      }
    }
  ]
}
```

## 安全最佳实践

### API密钥安全

1. **使用环境变量**: 始终优先使用环境变量方式存储API密钥
2. **避免硬编码**: 不要将实际API密钥写入配置文件
3. **版本控制排除**: 确保 `.env` 文件在 `.gitignore` 中
4. **权限最小化**: 为API密钥设置最小必要权限
5. **定期轮换**: 定期更新和轮换API密钥

### 生产环境建议

1. **密钥管理服务**: 考虑使用 AWS Secrets Manager、Azure Key Vault 等
2. **访问控制**: 限制配置文件的读取权限
3. **监控审计**: 监控API密钥的使用情况
4. **备份恢复**: 建立配置备份和恢复机制

### 配置文件安全

```bash
# 设置合适的文件权限
chmod 600 config/unified-providers.json

# 只允许应用用户读取
chown app:app config/unified-providers.json
```

## 相关文档

- [提供商启用/禁用功能详细说明](./PROVIDER_ENABLED_TOGGLE.md)
- [工具修复配置指南](./TOOL_REPAIR_GUIDE.md)
- [环境设置指南](./ENVIRONMENT_SETUP.md)
- [配置热重载说明](./CONFIG_HOT_RELOAD.md)

## 版本兼容性

- **v1.0.0+**: 支持基本提供商配置
- **v1.0.2+**: 支持 `enabled` 字段进行提供商启用/禁用控制
- **当前版本**: 支持所有上述功能

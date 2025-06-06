# 🔧 环境变量配置完整指南

本文档详细说明了 Universal Ollama Proxy 中所有环境变量的配置方法。

## 📋 环境变量概览

### 🔑 AI 提供商 API Keys

| 环境变量             | 提供商         | 描述               | 获取方式                                              |
| -------------------- | -------------- | ------------------ | ----------------------------------------------------- |
| `VOLCENGINE_API_KEY` | 火山方舟引擎   | 字节跳动豆包大模型 | [火山引擎控制台](https://console.volcengine.com/)     |
| `DASHSCOPE_API_KEY`  | 阿里云百炼     | 阿里云通义千问模型 | [阿里云控制台](https://dashscope.console.aliyun.com/) |
| `TENCENTDS_API_KEY`  | 腾讯云DeepSeek | 腾讯云托管DeepSeek | [腾讯云控制台](https://console.cloud.tencent.com/)    |
| `DEEPSEEK_API_KEY`   | DeepSeek官方   | DeepSeek官方服务   | [DeepSeek平台](https://platform.deepseek.com/)        |
| `OPENROUTER_API_KEY` | OpenRouter     | 多模型聚合服务平台 | [OpenRouter平台](https://openrouter.ai/)              |

### 🚀 服务器配置

| 环境变量   | 描述           | 默认值        | 示例值       |
| ---------- | -------------- | ------------- | ------------ |
| `PORT`     | 服务器监听端口 | `11434`       | `11434`      |
| `NODE_ENV` | 运行环境       | `development` | `production` |

### 📊 日志配置

| 环境变量        | 描述             | 默认值      | 可选值                           |
| --------------- | ---------------- | ----------- | -------------------------------- |
| `LOG_LEVEL`     | 基础日志级别     | `info`      | `debug`, `info`, `warn`, `error` |
| `CHAT_LOGS`     | 启用详细聊天日志 | `false`     | `true`, `false`                  |
| `CHAT_LOGS_DIR` | 聊天日志存储目录 | `logs/chat` | 任意有效路径                     |

## 🛠️ 配置方法

### 1. .env 文件配置（推荐）

在项目根目录创建 `.env` 文件：

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env` 文件内容：

```env
# 服务器配置
PORT=11434
NODE_ENV=production

# 火山方舟引擎配置
VOLCENGINE_API_KEY=your_volcengine_api_key_here

# 阿里云百炼配置
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# 腾讯云DeepSeek配置
TENCENTDS_API_KEY=your_tencentds_api_key_here

# DeepSeek官方配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# OpenRouter配置
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 日志配置
LOG_LEVEL=info
CHAT_LOGS=false
CHAT_LOGS_DIR=logs/chat
```

### 2. 系统环境变量

#### Windows (PowerShell)

```powershell
# 临时设置（当前会话有效）
$env:OPENROUTER_API_KEY = "sk-or-your-api-key-here"
$env:VOLCENGINE_API_KEY = "your_volcengine_api_key_here"

# 永久设置（系统级）
[Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "sk-or-your-api-key-here", "User")
```

#### Linux/macOS (Bash)

```bash
# 临时设置（当前会话有效）
export OPENROUTER_API_KEY="sk-or-your-api-key-here"
export VOLCENGINE_API_KEY="your_volcengine_api_key_here"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export OPENROUTER_API_KEY="sk-or-your-api-key-here"' >> ~/.bashrc
echo 'export VOLCENGINE_API_KEY="your_volcengine_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Docker 环境配置

#### Docker Compose

环境变量已在 `docker-compose.yml` 中预配置：

```yaml
environment:
  - VOLCENGINE_API_KEY=${VOLCENGINE_API_KEY}
  - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
  - TENCENTDS_API_KEY=${TENCENTDS_API_KEY}
  - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
  - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
```

只需在 `.env` 文件中设置变量值即可。

#### 直接 Docker 运行

```bash
docker run -d \
  --name universal-ollama-proxy \
  -p 11434:11434 \
  -e OPENROUTER_API_KEY="sk-or-your-api-key-here" \
  -e VOLCENGINE_API_KEY="your_volcengine_api_key_here" \
  universal-ollama-proxy:latest
```

## 🔍 配置验证

### 启动前检查

服务提供了自动配置检查：

```bash
npm run check
```

此命令会验证：

- ✅ 环境变量配置
- ✅ API Key 格式
- ✅ 配置文件完整性
- ✅ 依赖包安装

### 运行时验证

启动服务后，检查 API 端点：

```bash
# 检查可用模型（包括 OpenRouter 模型）
curl http://localhost:11434/api/tags

# 检查服务状态
curl http://localhost:11434/
```

如果配置正确，您应该能看到来自所有配置提供商的模型列表。

## ⚠️ 重要注意事项

### API Key 安全

- 🔒 **永远不要** 将 API Key 提交到版本控制系统
- 🔒 使用 `.env` 文件管理敏感信息
- 🔒 确保 `.env` 文件已添加到 `.gitignore`

### 最低配置要求

- ⚡ **至少配置一个提供商** 的 API Key
- ⚡ 系统会自动过滤不可用的提供商
- ⚡ 建议配置多个提供商以实现负载均衡

### 错误排查

如果遇到配置问题：

1. 检查环境变量是否正确设置
2. 验证 API Key 格式和有效性
3. 查看服务启动日志中的错误信息
4. 确认网络连接正常

### 性能优化

- 🚀 生产环境建议使用 `NODE_ENV=production`
- 🚀 调试时可使用 `LOG_LEVEL=debug`
- 🚀 禁用不需要的聊天日志以节省存储空间

## 📚 相关文档

- [OpenRouter 设置指南](../OPENROUTER_SETUP.md)
- [提供商配置文档](PROVIDER_CONFIGURATION.md)
- [配置热重载指南](CONFIG_HOT_RELOAD.md)

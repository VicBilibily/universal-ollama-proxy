# ⚙️ 配置参数详解

本文档详细说明 Universal Ollama
Proxy 的所有配置参数，包括环境变量、AI 提供商配置和日志管理。

## 🔧 环境变量配置

### 基础服务配置

| 变量名      | 说明           | 默认值        | 必需 | 示例值       |
| ----------- | -------------- | ------------- | ---- | ------------ |
| `PORT`      | 服务器监听端口 | `11434`       | ❌   | `11434`      |
| `NODE_ENV`  | 运行环境       | `development` | ❌   | `production` |
| `LOG_LEVEL` | 日志级别       | `info`        | ❌   | `debug`      |

### 🔑 AI 提供商 API Keys

| 变量名               | 提供商         | 必需 | 获取方式                                              |
| -------------------- | -------------- | ---- | ----------------------------------------------------- |
| `VOLCENGINE_API_KEY` | 火山方舟引擎   | ⚠️   | [火山引擎控制台](https://console.volcengine.com/)     |
| `DASHSCOPE_API_KEY`  | 阿里云百炼     | ⚠️   | [阿里云控制台](https://dashscope.console.aliyun.com/) |
| `TENCENTDS_API_KEY`  | 腾讯云DeepSeek | ⚠️   | [腾讯云控制台](https://console.cloud.tencent.com/)    |
| `DEEPSEEK_API_KEY`   | DeepSeek官方   | ⚠️   | [DeepSeek平台](https://platform.deepseek.com/)        |
| `OPENROUTER_API_KEY` | OpenRouter     | ⚠️   | [OpenRouter平台](https://openrouter.ai/)              |

> **⚠️ 重要**: 至少需要配置一个提供商的 API Key，系统会自动过滤不可用的提供商

### 📊 日志配置

| 变量名          | 说明             | 默认值      | 可选值                           |
| --------------- | ---------------- | ----------- | -------------------------------- |
| `LOG_LEVEL`     | 基础日志级别     | `info`      | `debug`, `info`, `warn`, `error` |
| `CHAT_LOGS`     | 启用详细聊天日志 | `false`     | `true`, `false`                  |
| `CHAT_LOGS_DIR` | 聊天日志存储目录 | `logs/chat` | 任意有效路径                     |

#### 日志级别说明

- **`debug`**: 输出所有级别日志（包含详细调试信息）
- **`info`**: 输出 info、warn 和 error 级别日志
- **`warn`**: 只输出 warn 和 error 级别日志
- **`error`**: 只输出 error 级别日志

### 🔍 详细聊天日志功能

启用 `CHAT_LOGS=true` 后，系统会为每个聊天请求创建详细的日志文件：

```env
# 启用聊天详细日志记录
CHAT_LOGS=true
# 自定义日志存储目录
CHAT_LOGS_DIR=logs/chat
```

#### 🗂️ 日志文件结构

- **文件命名**: `{时间戳}_{随机ID}.json`
- **时间戳格式**: `YYYYMMDDHHMMSSMMM`（17位纯数字）
- **示例**: `20250605103015123_abc123def.json`

#### 📋 日志内容包含

- ✅ **完整请求参数**: model、messages、temperature 等
- ✅ **完整响应内容**: 包括所有 choices 和 usage 信息
- ✅ **流式响应块**: 每个流式响应 chunk 的完整内容
- ✅ **错误信息**: 详细的错误堆栈和调试信息
- ✅ **性能指标**: 响应时间、token 使用量、数据大小
- ✅ **元数据**: 时间戳、客户端信息等

#### 🔧 日志管理命令

```bash
# Windows PowerShell
# 查看今天的请求日志
Get-ChildItem "logs\chat\20250605*.json" | Sort-Object Name

# 查看特定时间段的请求
Get-ChildItem "logs\chat\202506051030*.json" | Sort-Object Name

# 统计日志文件数量
(Get-ChildItem "logs\chat\*.json").Count

# Linux/macOS
# 查看今天的请求日志
ls logs/chat/20250605*.json | sort

# 查看特定时间段的请求
ls logs/chat/202506051030*.json | sort

# 统计日志文件数量
ls logs/chat/*.json | wc -l
```

## 📁 配置文件结构

### 主要配置文件

```
config/
├── unified-providers.json       # 统一提供商配置
├── volcengine-models.json      # 火山引擎模型配置
├── dashscope-models.json       # 阿里云百炼模型配置
├── tencentds-models.json       # 腾讯云DeepSeek模型配置
├── deepseek-models.json        # DeepSeek官方模型配置
├── openrouter-models.json      # OpenRouter模型配置
├── message-processing-rules.json # 消息处理规则
└── tool-filter-rules.json      # 工具过滤规则
```

### 🔄 配置热重载

系统支持配置热重载，修改配置文件后会自动生效，无需重启服务：

- 监控所有 `config/*.json` 文件变化
- 自动验证配置文件格式
- 配置错误时回滚到上一个有效配置
- 实时日志显示配置加载状态

## 🌍 环境变量占位符

配置文件中支持环境变量占位符，格式：`${ENV_VAR}` 或 `${ENV_VAR:default_value}`

### 示例用法

```json
{
  "apiKey": "${VOLCENGINE_API_KEY}",
  "baseUrl": "${CUSTOM_BASE_URL:https://ark.cn-beijing.volces.com}",
  "timeout": "${REQUEST_TIMEOUT:30000}"
}
```

### 支持的占位符格式

- `${VAR}` - 直接替换为环境变量值
- `${VAR:default}` - 如果环境变量不存在，使用默认值
- `${VAR:}` - 如果环境变量不存在，使用空字符串

## 🛡️ 安全配置建议

### API Key 安全

```env
# ✅ 推荐：使用环境变量
VOLCENGINE_API_KEY=your_real_api_key_here

# ❌ 不推荐：直接写在配置文件中
# 配置文件可能被意外提交到版本控制系统
```

### 权限配置

```bash
# 设置配置文件权限（Linux/macOS）
chmod 600 .env
chmod 644 config/*.json

# 确保日志目录权限
chmod 755 logs/
chmod 644 logs/chat/*
```

### 生产环境配置

```env
# 生产环境推荐配置
NODE_ENV=production
LOG_LEVEL=warn
CHAT_LOGS=false

# 如需调试可临时启用
# LOG_LEVEL=debug
# CHAT_LOGS=true
```

## 📊 性能配置

### 并发控制

虽然目前没有直接的并发控制配置，但可以通过以下方式优化：

```env
# 控制日志详细程度以提升性能
LOG_LEVEL=warn  # 减少日志输出
CHAT_LOGS=false # 关闭详细聊天日志
```

### 内存优化

```env
# 控制日志文件大小和数量
CHAT_LOGS_DIR=logs/chat  # 使用专门的日志目录
# 定期清理旧日志文件
```

## 🔧 配置验证

### 验证命令

```bash
# 验证所有配置
npm run check

# 仅验证环境变量
node -e "require('dotenv').config(); console.log('Environment variables loaded successfully');"

# 仅验证配置文件
node -e "console.log('Config files:', require('fs').readdirSync('config/'));"
```

### 常见配置错误

#### JSON 格式错误

```json
// ❌ 错误：最后一项后有逗号
{
  "key1": "value1",
  "key2": "value2",
}

// ✅ 正确
{
  "key1": "value1",
  "key2": "value2"
}
```

#### 环境变量未定义

```env
# ❌ 错误：API Key 未配置
# VOLCENGINE_API_KEY=

# ✅ 正确：配置有效的 API Key
VOLCENGINE_API_KEY=your_actual_api_key_here
```

---

## 📚 相关文档

- [返回主页](../README.md)
- [详细特性说明](./FEATURES.md)
- [支持的模型](./SUPPORTED_MODELS.md)
- [安装指南](./INSTALLATION_GUIDE.md)
- [API 接口文档](./API_REFERENCE.md)
- [开发指南](./DEVELOPMENT.md)
- [故障排除](./TROUBLESHOOTING.md)

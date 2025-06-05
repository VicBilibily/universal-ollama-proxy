# 🚀 AI 模型统一代理 - Ollama 兼容接口

[![CI](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml)
[![Release](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/VicBilibily/universal-ollama-proxy)](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**基于 OpenAI
SDK 的统一适配器架构**，将多个 AI 服务提供商统一为 Ollama 兼容接口，**专为 GitHub
Copilot Chat 的 Ollama 接入优化**。

> **🎯 设计目的**：本项目专为兼容 GitHub Copilot
> Chat 的 Ollama 接入而设计，同时提供完整的 OpenAI 兼容接口。

## ✨ 核心特性

### 🏗️ 统一架构

- **OpenAI SDK 基础**：基于 OpenAI SDK 的统一适配器服务
- **类型安全**：完整的 TypeScript 类型定义
- **请求队列**：智能请求队列管理，避免并发冲突

### 🔄 配置管理

- **热重载**：配置文件实时更新，无需重启服务
- **动态加载**：运行时动态加载和卸载提供商
- **环境变量**：支持环境变量占位符，安全管理 API Keys

### 📊 监控与日志

- **详细日志**：完整的请求/响应日志记录
- **性能监控**：响应时间、Token 使用量统计
- **错误追踪**：详细的错误堆栈和调试信息

### 🛠️ 消息处理

- **过滤规则**：自定义消息内容过滤和处理
- **格式转换**：自动处理不同提供商的消息格式差异
- **兼容性**：确保与 GitHub Copilot Chat 完美兼容

### 🌍 多平台支持

- **预编译**：提供所有主流平台的预编译二进制文件
- **无依赖**：二进制文件独立运行，无需 Node.js 环境
- **自动构建**：GitHub Actions 自动构建和发布

## 📡 支持的 API 接口

### Ollama 兼容接口

专为 GitHub Copilot Chat 优化，完全兼容 Ollama 标准：

| 接口           | 方法 | 说明               | 状态        |
| -------------- | ---- | ------------------ | ----------- |
| `/`            | GET  | 健康检查和服务状态 | ✅ 完整支持 |
| `/api/version` | GET  | 获取服务版本信息   | ✅ 完整支持 |
| `/api/tags`    | GET  | 获取可用模型列表   | ✅ 完整支持 |
| `/api/show`    | POST | 显示特定模型信息   | ✅ 完整支持 |

### OpenAI 兼容接口

标准的 OpenAI API 格式，支持所有主流客户端：

| 接口                   | 方法 | 说明                        | 状态        |
| ---------------------- | ---- | --------------------------- | ----------- |
| `/v1/chat/completions` | POST | 聊天完成接口（流式/非流式） | ✅ 完整支持 |

**模型名称格式**：使用 `provider:model` 格式，如
`volcengine:doubao-1.5-pro-32k-250115`

## 🎯 支持的 AI 提供商和模型

### 🔥 火山方舟引擎（豆包大模型）

**字节跳动旗下的大模型服务平台**

#### 深度思考模型系列

- `volcengine:doubao-1.5-thinking-pro-250415` - 豆包1.5深度思考Pro
- `volcengine:doubao-1.5-thinking-vision-pro-250428` - 豆包1.5深度思考视觉Pro
- `volcengine:doubao-1.5-thinking-pro-m-250428` - 豆包1.5深度思考Pro-M

#### 视觉理解模型系列

- `volcengine:doubao-1.5-vision-pro-250328` - 豆包1.5视觉Pro
- `volcengine:doubao-1.5-vision-lite-250315` - 豆包1.5视觉Lite
- `volcengine:doubao-1.5-vision-pro-32k-250115` - 豆包1.5视觉Pro 32K

#### 文本生成模型系列

- `volcengine:doubao-1.5-pro-32k-250115` - 豆包1.5 Pro 32K
- `volcengine:doubao-1.5-pro-256k-250115` - 豆包1.5 Pro 256K
- `volcengine:doubao-1.5-lite-32k-250115` - 豆包1.5 Lite 32K

#### DeepSeek 系列（火山代理）

- `volcengine:deepseek-v3-250324` - DeepSeek V3
- `volcengine:deepseek-v3-241226` - DeepSeek V3 初始版
- `volcengine:deepseek-r1-250528` - DeepSeek R1
- `volcengine:deepseek-r1-250120` - DeepSeek R1 旧版

### 🚀 阿里云百炼（通义千问）

**阿里巴巴自研的大语言模型服务**

#### 文本生成模型系列

- `dashscope:qwen-max` / `dashscope:qwen-max-latest` - 通义千问Max
- `dashscope:qwen-plus` / `dashscope:qwen-plus-latest` - 通义千问Plus
- `dashscope:qwen-turbo` / `dashscope:qwen-turbo-latest` - 通义千问Turbo
- `dashscope:qwen-long` / `dashscope:qwen-long-latest` - 通义千问Long（长文本）

#### 视觉理解模型系列

- `dashscope:qwen-vl-max` - 通义千问VL Max
- `dashscope:qwen-vl-plus` - 通义千问VL Plus

### 🔥 腾讯云 DeepSeek

**腾讯云托管的 DeepSeek 模型服务**

#### 推理模型系列

- `tencentds:deepseek-r1` - DeepSeek R1 推理模型
- `tencentds:deepseek-r1-0528` - DeepSeek R1-0528 版本

#### 文本生成模型系列

- `tencentds:deepseek-v3` - DeepSeek V3 文本生成
- `tencentds:deepseek-v3-0324` - DeepSeek V3-0324 版本
- `tencentds:deepseek-prover-v2` - DeepSeek Prover V2（数学证明专用）

### 🎯 DeepSeek 官方

**DeepSeek 官方直接提供的模型服务**

#### 聊天模型系列

- `deepseek:deepseek-chat` - DeepSeek Chat 官方版本
- `deepseek:deepseek-reasoner` - DeepSeek Reasoner 推理专用

## 📥 快速开始（推荐：预编译版本）

**🎯 推荐方式**: 直接从
[Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
页面下载预编译的程序包，**无需安装 Node.js 环境**。

> 🤖 **自动构建保障**: 所有发布版本均通过 GitHub
> Actions 自动构建，确保一致性和可靠性。

### 📦 下载预编译版本

| 操作系统       | 架构          | 下载文件                                               |
| -------------- | ------------- | ------------------------------------------------------ |
| 🪟 **Windows** | x64           | `universal-ollama-proxy-v{version}-windows-x64.zip`    |
| 🪟 **Windows** | ARM64         | `universal-ollama-proxy-v{version}-windows-arm64.zip`  |
| 🐧 **Linux**   | x64           | `universal-ollama-proxy-v{version}-linux-x64.tar.gz`   |
| 🐧 **Linux**   | ARM64         | `universal-ollama-proxy-v{version}-linux-arm64.tar.gz` |
| 🍎 **macOS**   | Intel         | `universal-ollama-proxy-v{version}-macos-x64.tar.gz`   |
| 🍎 **macOS**   | Apple Silicon | `universal-ollama-proxy-v{version}-macos-arm64.tar.gz` |

### 🚀 安装和使用步骤

#### 1️⃣ 下载解压

```bash
# 选择对应平台的压缩包下载并解压
# Windows 示例
unzip universal-ollama-proxy-v1.0.2-windows-x64.zip

# Linux/macOS 示例
tar -xzf universal-ollama-proxy-v1.0.2-linux-x64.tar.gz
```

#### 2️⃣ 配置 API Keys

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置至少一个提供商的 API Key
# Windows
notepad .env
# Linux/macOS
nano .env
```

**必需配置（至少选择一个）**：

```env
# 火山方舟引擎 API Key
VOLCENGINE_API_KEY=your_volcengine_api_key_here

# 阿里云百炼 API Key
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# 腾讯云DeepSeek API Key
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here

# DeepSeek官方 API Key
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

#### 3️⃣ 启动服务

```bash
# Windows
./universal-ollama-proxy-win-x64.exe

# Linux
./universal-ollama-proxy-linux-x64

# macOS
./universal-ollama-proxy-macos-x64
```

#### 4️⃣ 验证运行

服务启动后访问：

- **健康检查**: http://localhost:11434
- **模型列表**: http://localhost:11434/api/tags

### 📁 预编译包内容

每个压缩包都包含：

- ✅ **独立可执行文件**（无需 Node.js 环境）
- ✅ **完整配置文件** (`config/` 目录)
- ✅ **环境变量示例** (`.env.example`)
- ✅ **使用说明文档**

## 🛠️ 开发者安装（源码方式）

如果需要从源码编译、进行开发或自定义配置，请使用以下方式：

### 📋 前置要求

- **Node.js**: 16.x 或更高版本
- **npm**: 7.x 或更高版本
- **Git**: 用于克隆仓库

### 🔧 安装步骤

#### 1️⃣ 克隆项目

```powershell
# 克隆仓库
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy

# 安装依赖
npm install
```

#### 2️⃣ 环境配置

```powershell
# 复制环境变量模板
Copy-Item .env.example .env

# 编辑配置文件
notepad .env
```

#### 3️⃣ 配置 API Keys

在 `.env` 文件中配置至少一个服务商的 API Key：

```env
PORT=11434

# 至少配置一个提供商
VOLCENGINE_API_KEY=your_volcengine_api_key_here
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 可选配置
LOG_LEVEL=info
CHAT_LOGS=false
CHAT_LOGS_DIR=logs/chat
```

#### 4️⃣ 启动服务

```powershell
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run build
npm start
```

### 🔍 验证安装

服务启动后，访问以下端点验证：

- **健康检查**: http://localhost:11434
- **模型列表**: http://localhost:11434/api/tags
- **服务版本**: http://localhost:11434/api/version

## 🚀 API 使用示例

### 💬 Ollama 兼容接口

#### 获取可用模型列表

```powershell
# 获取所有可用模型
Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET
```

#### 获取模型详细信息

```powershell
# 获取特定模型信息
$body = @{
    model = "volcengine:doubao-1.5-pro-32k-250115"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:11434/api/show" -Method POST -Body $body -ContentType "application/json"
```

### 🤖 OpenAI 兼容接口

#### 非流式聊天对话

```powershell
# 标准聊天请求
$chatBody = @{
    model = "volcengine:doubao-1.5-pro-32k-250115"
    messages = @(
        @{
            role = "user"
            content = "你好，请介绍一下你自己"
        }
    )
    temperature = 0.7
    max_tokens = 1000
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:11434/v1/chat/completions" -Method POST -Body $chatBody -ContentType "application/json"
```

#### 流式聊天对话

```powershell
# 流式聊天请求
$streamBody = @{
    model = "dashscope:qwen-plus"
    messages = @(
        @{
            role = "user"
            content = "写一个关于人工智能的短故事"
        }
    )
    stream = $true
    temperature = 0.8
} | ConvertTo-Json -Depth 10

# 使用 curl 处理流式响应
curl.exe -X POST "http://localhost:11434/v1/chat/completions" `
  -H "Content-Type: application/json" `
  -d $streamBody `
  --no-buffer
```

### 🌐 使用 curl 命令示例

```bash
# 获取模型列表
curl http://localhost:11434/api/tags

# 聊天对话
curl -X POST "http://localhost:11434/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencentds:deepseek-v3",
    "messages": [
      {"role": "user", "content": "解释一下量子计算的基本原理"}
    ],
    "temperature": 0.7
  }'

# 流式聊天
curl -X POST "http://localhost:11434/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek:deepseek-chat",
    "messages": [
      {"role": "user", "content": "写一首关于春天的诗"}
    ],
    "stream": true
  }' \
  --no-buffer
```

## ⚙️ 配置参数详解

### 🔧 环境变量配置

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

```powershell
# 查看今天的请求日志
Get-ChildItem "logs\chat\20250605*.json" | Sort-Object Name

# 查看特定时间段的请求
Get-ChildItem "logs\chat\202506051030*.json" | Sort-Object Name

# 统计日志文件数量
(Get-ChildItem "logs\chat\*.json").Count
```

## 📚 项目架构与文档

### 🏗️ 项目结构

```
universal-ollama-proxy/
├── 📁 src/                    # 源代码目录
│   ├── app.ts                 # 主应用程序
│   ├── index.ts               # 程序入口点
│   ├── 📁 controllers/        # 控制器层
│   │   ├── ollama.ts          # Ollama API 控制器
│   │   └── openai.ts          # OpenAI API 控制器
│   ├── 📁 services/           # 服务层
│   │   ├── unified-adapter.ts # 统一适配器服务（核心）
│   │   ├── modelDiscovery.ts  # 模型发现服务
│   │   ├── configHotReload.ts # 配置热重载服务
│   │   ├── ollama.ts          # Ollama 服务
│   │   └── openai.ts          # OpenAI 兼容服务
│   ├── 📁 middleware/         # 中间件
│   ├── 📁 types/              # TypeScript 类型定义
│   ├── 📁 utils/              # 工具函数
│   └── 📁 config/             # 配置管理
├── 📁 config/                 # 配置文件目录
│   ├── unified-providers.json # 统一提供商配置
│   ├── volcengine-models.json # 火山引擎模型配置
│   ├── dashscope-models.json  # 阿里云百炼模型配置
│   ├── tencentds-models.json  # 腾讯云DeepSeek模型配置
│   ├── deepseek-models.json   # DeepSeek官方模型配置
│   └── message-processing-rules.json # 消息处理规则
├── 📁 docs/                   # 项目文档
├── 📁 scripts/                # 构建和工具脚本
├── 📁 binaries/               # 预编译二进制文件
└── 📁 releases/               # 发布版本文件
```

### 🔧 核心架构特性

#### 🎯 统一适配器服务 (UnifiedAdapterService)

- **基于 OpenAI SDK**: 所有 AI 提供商统一使用 OpenAI SDK 处理
- **类型安全**: 完整的 TypeScript 类型定义和验证
- **请求队列**: 智能请求队列管理，防止并发冲突
- **错误处理**: 统一的错误处理和重试机制

#### 🔄 配置热重载系统

- **实时监控**: 监控配置文件变化并自动重载
- **无缝更新**: 运行时动态更新配置，无需重启服务
- **配置验证**: 自动验证配置文件格式和有效性

#### 📊 模型发现服务

- **动态发现**: 自动发现和注册可用模型
- **提供商管理**: 智能管理多提供商模型列表
- **状态监控**: 实时监控模型可用性状态

### 📖 详细文档

| 文档                    | 说明                            | 路径                                                                               |
| ----------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| 🔧 **提供商配置指南**   | API密钥配置方式及模型可用性说明 | [docs/PROVIDER_CONFIGURATION.md](./docs/PROVIDER_CONFIGURATION.md)                 |
| 📋 **模型配置规范**     | 模型配置文件格式定义和说明      | [docs/MODEL_CONFIG_SPECIFICATION.md](./docs/MODEL_CONFIG_SPECIFICATION.md)         |
| 🔄 **配置热重载**       | 配置热重载功能详细说明          | [docs/CONFIG_HOT_RELOAD.md](./docs/CONFIG_HOT_RELOAD.md)                           |
| 💬 **消息处理规则**     | 消息处理规则配置详细说明        | [docs/MESSAGE_PROCESSING_RULES.md](./docs/MESSAGE_PROCESSING_RULES.md)             |
| 🚀 **消息处理快速入门** | 消息处理功能入门指南            | [docs/MESSAGE_PROCESSING_QUICK_START.md](./docs/MESSAGE_PROCESSING_QUICK_START.md) |
| 🏗️ **构建指南**         | 源码构建和开发环境配置          | [docs/BUILD_GUIDE.md](./docs/BUILD_GUIDE.md)                                       |
| 🤖 **自动发布指南**     | CI/CD自动化构建和发布流程       | [docs/AUTO_RELEASE_GUIDE.md](./docs/AUTO_RELEASE_GUIDE.md)                         |

## 🔨 开发指令大全

### 📦 基础开发命令

```powershell
# 安装依赖
npm install

# 开发模式（支持热重载）
npm run dev

# 构建项目
npm run build

# 启动生产服务
npm start

# 清理构建文件
npm run clean

# 代码格式化
npm run format

# 检查代码格式
npm run format:check

# 验证配置和环境
npm run check
```

### 🏗️ 构建相关命令

```powershell
# 构建所有平台二进制文件
npm run build:binaries

# 验证二进制文件完整性
npm run verify:binaries

# 验证发布包
npm run verify:releases

# 创建发布包
npm run create:release

# 完整发布流程（构建+验证+打包）
npm run release

# 查看构建状态和信息
npm run build:info
```

### 🛠️ 实用工具命令

```powershell
# 交互式快速构建工具
npm run quick:build

# 测试所有模型连接
npm run test-all-models-chat

# 检查CI/CD配置
npm run check:cicd

# 验证发布版本
npm run validate:release

# 监控GitHub Actions状态
npm run monitor:actions
```

### 🔧 开发工具脚本

```powershell
# 直接运行脚本
node scripts/build-info.js          # 显示构建信息
node scripts/quick-build.js         # 交互式快速构建
node scripts/test-all-models.js     # 测试所有模型
node scripts/check-setup.js         # 检查环境配置
node scripts/validate-release.js    # 验证发布版本
```

## 🚀 自动化 CI/CD 流程

### 🎯 智能发布系统

本项目配置了完整的自动化发布流程，支持 **GitHub Release 自动触发** 和
**手动工作流触发** 两种方式！

#### ✨ 核心自动化特性

- 🎯 **双重触发模式**: GitHub Release 自动触发 + 手动工作流触发
- 🧠 **智能构建检查**: 自动检测已存在文件，支持增量构建和强制重建
- 🌍 **全平台覆盖**: 自动生成 6 个平台版本（Windows/Linux/macOS × x64/ARM64）
- ⚡ **快速构建**: 3-5 分钟完成所有平台构建和发布
- 🔧 **版本号智能处理**: 自动兼容带 `v` 前缀和不带前缀的版本标签
- 📝 **自动Release描述**: 如果Release描述为空，自动生成详细的发布说明
- 🧹 **文件清理验证**: 自动清理重复文件，确保发布包完整性
- 📊 **构建报告生成**: 自动生成详细构建报告和artifact存档（保留30天）

#### 🔄 持续集成流程

- **代码质量检查**: 自动运行 Prettier 格式检查、TypeScript 编译验证
- **跨版本兼容性**: 在 Node.js 16、18、20 版本上全面测试
- **跨平台构建验证**: Ubuntu、Windows、macOS 三平台环境自动验证
- **二进制文件测试**: 在 Ubuntu 环境下自动构建和验证二进制文件

### 📋 发布方式

#### 🌟 方式一：GitHub Release（推荐）

1. 进入 GitHub 仓库的
   [Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases)
   页面
2. 点击 **"Create a new release"**
3. 输入版本号（如 `v1.0.3`）和发布说明
4. 点击 **"Publish release"**
5. **等待 3-5 分钟，所有平台包自动出现在 Release 页面** 🎉

#### 🔧 方式二：本地构建

```powershell
# 1. 克隆仓库并安装依赖
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy
npm install

# 2. 运行完整发布流程
npm run release

# 或使用交互式快速构建工具
npm run quick:build
```

构建完成后在 `releases/` 目录中查看生成的发布包。

#### 📊 构建产物

每次发布会自动生成以下文件：

- `universal-ollama-proxy-v{version}-windows-x64.zip`
- `universal-ollama-proxy-v{version}-windows-arm64.zip`
- `universal-ollama-proxy-v{version}-linux-x64.tar.gz`
- `universal-ollama-proxy-v{version}-linux-arm64.tar.gz`
- `universal-ollama-proxy-v{version}-macos-x64.tar.gz`
- `universal-ollama-proxy-v{version}-macos-arm64.tar.gz`

> 📖 **详细文档**: [自动发布指南](./docs/AUTO_RELEASE_GUIDE.md)

## 🔧 故障排除指南

### 🚨 常见问题及解决方案

#### 🔑 认证相关问题

**问题**: API Key 认证失败

```
解决方案:
1. 检查 .env 文件中 API Key 配置是否正确
2. 确认 API Key 格式符合对应平台要求
3. 验证 API Key 是否有足够的权限和额度
4. 检查网络连接是否正常
```

**问题**: 提示"未找到可用的提供商"

```
解决方案:
1. 确保至少配置了一个有效的 API Key
2. 运行 `npm run check` 验证配置
3. 查看日志中的详细错误信息
4. 检查 config/unified-providers.json 配置文件
```

#### 🤖 模型相关问题

**问题**: 模型不可用或找不到

```
解决方案:
1. 确认模型已在对应平台开通
2. 检查模型名称格式是否正确（provider:model）
3. 访问 /api/tags 查看可用模型列表
4. 查看模型配置文件是否正确加载
```

**问题**: 模型响应超时

```
解决方案:
1. 检查网络连接稳定性
2. 增加请求超时时间配置
3. 确认API服务提供商状态正常
4. 检查是否达到了API调用频率限制
```

#### 🌐 网络连接问题

**问题**: 网络请求失败

```
解决方案:
1. 检查防火墙设置和网络连接
2. 确认代理配置（如果使用代理）
3. 验证DNS解析是否正常
4. 检查目标API服务是否可达
```

#### 📁 配置文件问题

**问题**: 配置文件读取失败

```
解决方案:
1. 检查配置文件JSON格式是否正确
2. 确认文件路径和权限设置
3. 运行 `npm run check` 验证配置
4. 查看详细错误日志定位问题
```

### 📊 日志相关问题

#### 🗂️ 聊天日志问题

**问题**: 日志文件未生成

```
解决方案:
1. 确认 CHAT_LOGS=true 配置正确
2. 检查日志目录权限和磁盘空间
3. 验证日志目录路径是否存在
4. 查看主日志中的错误信息
```

**问题**: 无法查看日志内容

```
解决方案:
1. 确认日志文件为有效的JSON格式
2. 使用JSON查看器或文本编辑器打开
3. 检查文件是否被其他程序占用
4. 验证文件权限设置
```

### 🛠️ 调试建议

#### 🔍 启用详细调试

```env
# 在 .env 文件中设置详细调试
LOG_LEVEL=debug
CHAT_LOGS=true
CHAT_LOGS_DIR=logs/chat
```

#### 📋 诊断步骤

1. **检查配置**: 运行 `npm run check` 验证环境配置
2. **启用详细日志**: 设置 `LOG_LEVEL=debug`
3. **记录完整日志**: 启用 `CHAT_LOGS=true`
4. **查看错误详情**: 检查 `logs/chat/` 目录下的日志文件
5. **分析性能数据**: 查看响应时间和Token使用统计

#### 📈 性能优化建议

- **定期清理日志**: 删除过期的聊天日志文件释放磁盘空间
- **监控资源使用**: 注意CPU和内存使用情况
- **网络优化**: 确保网络连接稳定和带宽充足
- **并发控制**: 避免过多的并发请求

#### 🆘 获取帮助

如果问题仍然存在，请：

1. 收集详细的错误日志和配置信息
2. 前往
   [GitHub Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues)
   报告问题
3. 提供复现步骤和环境信息
4. 附上相关的日志文件（注意隐藏敏感信息）

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

## 🙏 致谢

感谢以下开源项目和服务提供商：

- **[OpenAI](https://openai.com/)** - 提供优秀的 SDK 和 API 标准
- **[GitHub Actions](https://github.com/features/actions)** - 强大的 CI/CD 自动化平台
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript 超集
- **[Express.js](https://expressjs.com/)** - 快速、灵活的 Node.js Web 框架

### 🤝 AI 服务提供商

- **火山方舟引擎** - 字节跳动旗下的企业级AI服务平台
- **阿里云百炼** - 阿里巴巴自研的大语言模型服务平台
- **腾讯云** - 腾讯云托管的 DeepSeek 模型服务
- **DeepSeek** - 优秀的开源大语言模型提供商

---

<div align="center">

### 🌟 如果这个项目对你有帮助，请给个 Star ⭐

**Made with ❤️ for the AI community**

[🏠 Homepage](https://github.com/VicBilibily/universal-ollama-proxy) |
[📖 Documentation](./docs/) |
[🐛 Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues) |
[🚀 Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases)

</div>

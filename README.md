# AI 模型统一代理 - Ollama 兼容接口

[![CI](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml)
[![Release](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/VicBilibily/universal-ollama-proxy)](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

将多个 AI 服务提供商统一为 Ollama 兼容接口，**主要用于 GitHub Copilot
Chat 的 Ollama 接入**。

> **⚠️ 设计目的**：本项目专为兼容 GitHub Copilot
> Chat 的 Ollama 接入而设计，其他非关键接口仅为模拟实现。

## 🚀 核心特性

- **Copilot 兼容**：专为 GitHub Copilot Chat 的 Ollama 接入优化
- **统一架构**：基于 OpenAI SDK 的统一适配器
- **多提供商**：火山方舟引擎、阿里云百炼、腾讯云 DeepSeek、DeepSeek 官方
- **类型安全**：TypeScript 编写，完整类型定义
- **生产就绪**：错误处理、日志、监控

## 📋 API 接口状态

#### Ollama 兼容接口

- `GET /api/tags` - 获取模型列表
- `POST /api/show` - 显示模型信息

#### OpenAI 兼容接口

- `POST /v1/chat/completions` - OpenAI 聊天接口（支持流式/非流式）

## 🎯 支持的模型

#### 🔥 火山方舟引擎（豆包）

**深度思考模型**

- `doubao-1.5-thinking-pro-250415` - 豆包1.5深度思考Pro
- `doubao-1.5-thinking-vision-pro-250428` - 豆包1.5深度思考视觉Pro
- `doubao-1.5-thinking-pro-m-250428` - 豆包1.5深度思考Pro-M

**视觉理解模型**

- `doubao-1.5-vision-pro-250328` - 豆包1.5视觉Pro
- `doubao-1.5-vision-lite-250315` - 豆包1.5视觉Lite
- `doubao-1.5-vision-pro-32k-250115` - 豆包1.5视觉Pro 32K

**文本生成模型**

- `doubao-1.5-pro-32k-250115` - 豆包1.5 Pro 32K
- `doubao-1.5-pro-256k-250115` - 豆包1.5 Pro 256K
- `doubao-1.5-lite-32k-250115` - 豆包1.5 Lite 32K

**DeepSeek 系列**

- `deepseek-v3-250324` - DeepSeek V3
- `deepseek-v3-241226` - DeepSeek V3 初始版
- `deepseek-r1-250528` - DeepSeek R1
- `deepseek-r1-250120` - DeepSeek R1 旧版

#### 🚀 阿里云百炼（通义千问）

**文本生成模型**

- `qwen-max` / `qwen-max-latest` - 通义千问Max
- `qwen-plus` / `qwen-plus-latest` - 通义千问Plus
- `qwen-turbo` / `qwen-turbo-latest` - 通义千问Turbo
- `qwen-long` / `qwen-long-latest` - 通义千问Long（长文本）

**视觉理解模型**

- `qwen-vl-max` - 通义千问VL Max
- `qwen-vl-plus` - 通义千问VL Plus

#### 🔥 腾讯云DeepSeek

**推理模型**

- `deepseek-r1` - DeepSeek R1
- `deepseek-r1-0528` - DeepSeek R1-0528

**文本生成模型**

- `deepseek-v3` - DeepSeek V3
- `deepseek-v3-0324` - DeepSeek V3-0324
- `deepseek-prover-v2` - DeepSeek Prover V2（数学证明专用）

#### 🎯 DeepSeek 官方

**聊天模型**

- `deepseek-chat` - DeepSeek Chat 官方
- `deepseek-reasoner` - DeepSeek Reasoner 推理

## 📥 下载预编译版本

**推荐方式**: 直接从
[Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
页面下载预编译的程序包，无需安装 Node.js 环境。

> 🤖 **自动构建**: 所有发布版本均通过 GitHub
> Actions 自动构建，确保一致性和可靠性。

| 操作系统       | 架构          | 下载链接                                               |
| -------------- | ------------- | ------------------------------------------------------ |
| 🪟 **Windows** | x64           | `universal-ollama-proxy-v{version}-windows-x64.zip`    |
| 🪟 **Windows** | ARM64         | `universal-ollama-proxy-v{version}-windows-arm64.zip`  |
| 🐧 **Linux**   | x64           | `universal-ollama-proxy-v{version}-linux-x64.tar.gz`   |
| 🐧 **Linux**   | ARM64         | `universal-ollama-proxy-v{version}-linux-arm64.tar.gz` |
| 🍎 **macOS**   | Intel         | `universal-ollama-proxy-v{version}-macos-x64.tar.gz`   |
| 🍎 **macOS**   | Apple Silicon | `universal-ollama-proxy-v{version}-macos-arm64.tar.gz` |

### 🚀 使用预编译版本

1. **下载**: 选择对应平台的压缩包
2. **解压**: 解压到目标目录
3. **配置**: 复制 `.env.example` 为 `.env` 并配置 API Keys
4. **运行**: 直接运行可执行文件

每个压缩包都包含：

- ✅ 独立可执行文件（无需 Node.js）
- ✅ 完整配置文件 (`config/`)
- ✅ 环境变量示例 (`.env.example`)
- ✅ 使用说明文档

## 🛠️ 源码安装

如果需要从源码编译或进行开发，请使用以下方式：

### 1. 安装与配置

```bash
# 克隆项目
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env
```

### 2. 配置 API Keys

编辑 `.env` 文件，至少配置一个服务商的 API Key：

```env
PORT=11434

# 至少配置一个
VOLCENGINE_API_KEY=your_volcengine_api_key_here
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build && npm start
```

服务启动后访问 `http://localhost:11434`。

## API 使用示例

### 使用 HTTP API

#### 获取模型列表

```bash
curl http://localhost:11434/api/tags
```

#### 聊天对话

```bash
curl -X POST http://localhost:11434/api/chat `
  -H "Content-Type: application/json" `
  -d '{
    "model": "doubao-1.5-pro-32k-250115",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

#### 流式聊天

```bash
curl -X POST http://localhost:11434/api/chat `
  -H "Content-Type: application/json" `
  -d '{
    "model": "doubao-1.5-pro-32k-250115",
    "messages": [{"role": "user", "content": "写一个故事"}],
    "stream": true
  }'
```

## 环境变量配置

| 变量名               | 说明                   | 默认值        | 必需 |
| -------------------- | ---------------------- | ------------- | ---- |
| `PORT`               | 服务器端口             | `11434`       | ❌   |
| `NODE_ENV`           | 运行环境               | `development` | ❌   |
| `LOG_LEVEL`          | 日志级别               | `info`        | ❌   |
| `VOLCENGINE_API_KEY` | 火山方舟引擎 API Key   | -             | ⚠️   |
| `DASHSCOPE_API_KEY`  | 阿里云百炼 API Key     | -             | ⚠️   |
| `TENCENTDS_API_KEY`  | 腾讯云DeepSeek API Key | -             | ⚠️   |
| `DEEPSEEK_API_KEY`   | DeepSeek官方 API Key   | -             | ⚠️   |
| `CHAT_LOGS`          | 启用聊天详细日志       | `false`       | ❌   |
| `CHAT_LOGS_DIR`      | 聊天日志存储目录       | `logs/chat`   | ❌   |

> **注意**: 供应商 API Key 的环境变量名称是从 `config/unified-providers.json`
> 配置文件中动态读取的。当添加新的供应商时，只需在配置文件中定义相应的环境变量名（如
> `${NEW_PROVIDER_API_KEY}`），系统会自动从环境变量中读取对应的值，无需修改代码。以上列出的是当前配置中定义的API
> Key环境变量。

> 至少需要配置一个 API Key

### 日志级别说明

- `debug` - 输出所有级别日志（包含详细调试信息）
- `info` - 输出 info、warn 和 error 级别日志
- `warn` - 只输出 warn 和 error 级别日志
- `error` - 只输出 error 级别日志

### 聊天详细日志功能

启用 `CHAT_LOGS=true` 后，系统会为每个聊天请求创建详细的日志文件：

```env
# 启用聊天详细日志记录
CHAT_LOGS=true
# 自定义日志存储目录
CHAT_LOGS_DIR=logs/chat
```

#### 日志文件结构

每个聊天请求会生成一个综合日志文件：

- `{requestId}.json` - 包含请求的完整信息、响应内容及元数据

**请求ID格式**：`YYYYMMDDHHMMSSMMM_随机字符`

- 前17位：纯数字的日期时间（年月日时分秒毫秒）
- 后缀：随机字符串（9位）
- 示例：`20250604103015123_abc123def`

#### 日志内容包含

- **完整的请求参数**：model、messages、temperature 等所有参数
- **完整的响应内容**：包括所有 choices 和 usage 信息
- **流式响应块**：每个流式响应 chunk 的完整内容
- **错误信息**：详细的错误堆栈和调试信息
- **性能指标**：响应时间、token 使用量、数据大小
- **元数据**：时间戳、客户端信息等

#### 示例日志文件

```bash
logs/chat/
└── 20250604103015123_abc123def.json    # 完整的请求和响应日志
```

**文件命名规则**：

- 文件名格式：`{纯数字时间戳}_{随机ID}.json`
- 时间戳：17位纯数字（YYYYMMDDHHMMSSMMM）
- 随机ID：9位字符串，确保唯一性

#### 日志文件使用指南

**查看特定时间段的请求**：

```bash
# Windows PowerShell
Get-ChildItem logs\chat\202506041030*.json | Sort-Object Name

# 查看2025年6月4日10:30-10:31之间的所有请求
Get-ChildItem logs\chat\20250604103*.json | Sort-Object Name
```

**快速定位问题**：

1. 查看日志文件的 `summary` 部分获取请求概览
2. 检查 `response.error` 字段查看错误信息
3. 分析 `response.responseTime` 了解性能问题
4. 查看 `openaiRequest.messages` 了解完整对话上下文

**文件大小管理**：

- 每个请求生成一个独立的日志文件，便于分析
- 无文件大小限制，完整记录所有通讯内容
- 建议定期清理旧日志文件释放磁盘空间

## 项目结构

```
src/
├── app.ts              # 主应用
├── controllers/        # 控制器
├── services/          # 服务层
├── types/             # 类型定义
└── utils/             # 工具函数
```

## 开发指令

```bash
npm run dev         # 开发模式
npm run build       # 构建项目
npm run start       # 启动服务
npm run clean       # 清理构建文件

# 构建相关
npm run build:binaries    # 构建所有平台二进制文件
npm run verify:binaries   # 验证二进制文件
npm run create:release    # 创建发布包
npm run release          # 完整发布流程
npm run build:info       # 查看构建状态

# 工具脚本
node quick-build.js      # 交互式快速构建
node build-info.js       # 显示构建信息
```

## 🚀 CI/CD 自动化

本项目配置了完整的自动化发布流程，**手动创建 GitHub
Release 即可自动构建并上传所有平台的程序包**！

### 📦 自动发布特性

- 🎯 **一键触发**: 创建 GitHub Release 自动触发构建
- 🌍 **多平台支持**: 自动生成 6 个平台版本（Windows/Linux/macOS × x64/ARM64）
- ⚡ **快速构建**: 3-5 分钟完成所有平台构建
- ✅ **质量保证**: 自动代码检查、构建验证、包完整性检查
- 📋 **详细报告**: 自动生成构建报告和验证结果

### 🔄 持续集成

- **代码质量**: 自动运行 lint、格式检查、TypeScript 编译
- **跨版本测试**: 在 Node.js 16、18、20 上自动测试
- **跨平台验证**: Ubuntu、Windows、macOS 环境自动测试

### 📋 发布流程（两种方式）

#### 方式一：GitHub Release（推荐）

1. 进入 GitHub 仓库的
   [Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases)
   页面
2. 点击 "Create a new release"
3. 输入版本号（如 `v1.0.2`）和发布说明
4. 点击 "Publish release"
5. **等待 3-5 分钟，所有平台包自动出现在 Release 页面** 🎉

#### 方式二：本地构建

1. 克隆仓库并安装依赖

   ```bash
   git clone https://github.com/VicBilibily/universal-ollama-proxy.git
   cd universal-ollama-proxy
   npm install
   ```

2. 运行完整发布流程

   ```bash
   npm run release
   ```

   或使用交互式快速构建工具

   ```bash
   npm run quick:build
   ```

3. 构建完成后在 `releases/` 目录中查看生成的发布包

> 📖 **详细文档**: [自动发布指南](./AUTO_RELEASE_GUIDE.md)

## 故障排除

### 常见问题

1. **认证失败** - 检查 API Key 配置是否正确
2. **模型不可用** - 确认模型已在对应平台开通
3. **网络问题** - 检查防火墙设置和网络连接
4. **配置问题** - 运行 `npm run check` 检查配置

### 聊天日志相关问题

5. **日志文件未生成** - 确认 `CHAT_LOGS=true` 且目录权限正确
6. **日志目录不存在** - 系统会自动创建，检查磁盘空间和权限
7. **日志文件过大** - 无大小限制，注意磁盘空间管理
8. **查看日志内容** - 日志为 JSON 格式，可用文本编辑器或 JSON 查看器打开

### 调试建议

- 设置 `LOG_LEVEL=debug` 获取详细调试信息
- 启用 `CHAT_LOGS=true` 记录完整请求响应数据
- 检查 `logs/chat/` 目录下的日志文件分析问题
- 查看日志文件的 `summary` 部分获取性能统计和请求概览
- 日志文件按时间排序：文件名前17位是纯数字时间戳，便于按时间顺序查看
- 查找特定时间的请求：根据时间戳格式 `YYYYMMDDHHMMSSMMM` 快速定位文件

## 许可证

MIT License

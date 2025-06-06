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

- 🏗️ **统一架构** - 基于 OpenAI SDK 的统一适配器服务，完整的 TypeScript 类型安全
- 🔄 **配置管理** - 热重载配置文件，动态加载提供商，环境变量安全管理
- 📊 **监控日志** - 详细请求/响应日志，性能监控，错误追踪
- 🛠️ **消息处理** - 自定义过滤规则，格式转换，GitHub Copilot Chat 完美兼容
- 🛡️ **工具过滤** - 安全防护，规则引擎，格式转换，性能优化
- 🌍 **多平台** - 所有主流平台预编译二进制，无依赖运行，自动构建发布

📖 **[详细特性说明 →](./README/FEATURES.md)**

## 🎯 支持的 AI 提供商

| 提供商                 | 模型数量 | 特色功能                       |
| ---------------------- | -------- | ------------------------------ |
| 🔥 **火山方舟引擎**    | 12+      | 豆包大模型、深度思考、视觉理解 |
| 🚀 **阿里云百炼**      | 8+       | 通义千问系列、视觉理解         |
| 🔥 **腾讯云 DeepSeek** | 5+       | DeepSeek R1、V3、Prover        |
| 🎯 **DeepSeek 官方**   | 2+       | 聊天模型、推理模型             |
| 🌐 **OpenRouter**      | 15+      | GPT-4o、Claude、Gemini 聚合    |

📋 **[完整模型列表 →](./README/SUPPORTED_MODELS.md)**

## 📥 快速开始

### 🎯 方式一：预编译版本（推荐）

1. 从
   [Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
   下载对应平台的压缩包
2. 解压并配置 `.env` 文件（至少配置一个 API Key）
3. 运行可执行文件
4. 访问 http://localhost:11434 验证服务

### 🛠️ 方式二：源码安装

```bash
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy
npm install
cp .env.example .env  # 编辑配置 API Keys
npm run dev
```

📖 **[详细安装指南 →](./README/INSTALLATION_GUIDE.md)**

## ⚙️ 基础配置

在 `.env` 文件中配置至少一个 AI 提供商的 API Key：

```env
# 服务配置
PORT=11434

# AI 提供商 API Keys（至少配置一个）
VOLCENGINE_API_KEY=your_volcengine_api_key_here
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 日志配置
LOG_LEVEL=info
CHAT_LOGS=false
```

🔧 **[完整配置参数说明 →](./README/CONFIGURATION.md)**

## 📡 API 接口

### Ollama 兼容接口

- `GET /` - 健康检查和服务状态
- `GET /api/version` - 获取服务版本信息
- `GET /api/tags` - 获取可用模型列表
- `POST /api/show` - 显示特定模型信息

### OpenAI 兼容接口

- `POST /v1/chat/completions` - 聊天完成接口（流式/非流式）

**模型调用格式**：`provider:model`，如 `volcengine:doubao-1.5-pro-32k-250115`

📖 **[完整API接口文档 →](./README/API_REFERENCE.md)**

## 🛠️ 开发与部署

### 开发命令

```bash
npm run dev          # 开发模式（热重载）
npm run build        # 构建项目
npm run format       # 代码格式化
npm run check        # 验证配置和环境
```

### 构建发布

```bash
npm run build:binaries    # 构建所有平台二进制文件
npm run release          # 完整发布流程
npm run quick:build      # 交互式快速构建
```

🏗️ **[开发指南和架构说明 →](./README/DEVELOPMENT.md)**

## 📚 文档索引

| 文档                                                    | 说明                       |
| ------------------------------------------------------- | -------------------------- |
| 📖 [特性详解](./README/FEATURES.md)                     | 详细特性说明和功能介绍     |
| 🎯 [支持模型](./README/SUPPORTED_MODELS.md)             | 完整的 AI 提供商和模型列表 |
| 📥 [安装指南](./README/INSTALLATION_GUIDE.md)           | 详细安装和部署说明         |
| ⚙️ [配置参数](./README/CONFIGURATION.md)                | 完整配置参数详解           |
| 🏗️ [开发指南](./README/DEVELOPMENT.md)                  | 项目架构和开发说明         |
| 📡 [API接口](./README/API_REFERENCE.md)                 | API接口详细文档            |
| 🔧 [故障排除](./README/TROUBLESHOOTING.md)              | 常见问题解决方案           |
| 🔧 [提供商配置](./docs/PROVIDER_CONFIGURATION.md)       | API密钥配置指南            |
| 📋 [模型配置规范](./docs/MODEL_CONFIG_SPECIFICATION.md) | 模型配置文件格式           |
| 🔄 [配置热重载](./docs/CONFIG_HOT_RELOAD.md)            | 配置热重载功能说明         |
| 💬 [消息处理规则](./docs/MESSAGE_PROCESSING_RULES.md)   | 消息处理规则配置           |
| 🛡️ [工具过滤指南](./docs/TOOL_FILTER_GUIDE.md)          | 工具过滤功能说明           |
| 🚀 [自动发布指南](./docs/AUTO_RELEASE_GUIDE.md)         | CI/CD 自动化发布流程       |

## 🔧 故障排除

遇到问题？查看 **[故障排除指南](./README/TROUBLESHOOTING.md)**
获取常见问题的解决方案。

或者：

1. 运行 `npm run check` 验证配置
2. 设置 `LOG_LEVEL=debug` 查看详细日志
3. 前往
   [GitHub Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues)
   报告问题

## 🚀 自动化发布

本项目支持 GitHub Release 自动构建，只需：

1. 创建新的 GitHub Release
2. 等待 3-5 分钟
3. 所有平台包自动生成 🎉

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

---

<div align="center">

### 🌟 如果这个项目对你有帮助，请给个 Star ⭐

**Made with ❤️ for the AI community**

[🏠 Homepage](https://github.com/VicBilibily/universal-ollama-proxy) |
[📖 Documentation](./README/) |
[🐛 Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues) |
[🚀 Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases)

</div>

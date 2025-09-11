# Universal Ollama Proxy

[![CI](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml)
[![Release](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/VicBilibily/universal-ollama-proxy)](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个专为 GitHub Copilot
Chat 的 Ollama 接入而设计的代理服务。将多个AI服务提供商的API转换为Ollama兼容格式，让你可以在 GitHub
Copilot Chat 中使用不同的AI模型。基于TypeScript和OpenAI SDK构建。

> **⚠️ 重要通知 - 项目已经存档**
>
> 由于 VS Code 的 GitHub Copilot 即将支持 **OpenAI Compatible**
> 模型配置功能，用户将能够直接在 GitHub
> Copilot 中配置各种 AI 提供商的模型，无需通过本代理服务。
>
> - 📰 关注 [GitHub Copilot 官方更新](https://github.com/features/copilot)
>   获取最新功能发布信息
> - 🔗 准备迁移到官方支持的 OpenAI Compatible 配置方式 [PS: >
>   此功能官方延后至2025年10月发布]
>
> 感谢所有用户的支持和贡献！🙏
>
> ---
>
> 另：VSCode 2025年09月更新支持第三方插件作为 GitHub Copilot Chat 模型提供方。
>
> 当前项目正式由新项目接替
>
> ### GCMP - 提供多个国内主流AI大模型供应商支持的扩展
>
> [![CI](https://github.com/VicBilibily/GCMP/actions/workflows/ci.yml/badge.svg)](https://github.com/VicBilibily/GCMP/actions)
> [![Version](https://img.shields.io/visual-studio-marketplace/v/vicanent.gcmp?color=blue&label=Version)](https://marketplace.visualstudio.com/items?itemName=vicanent.gcmp)
> [![Downloads](https://img.shields.io/visual-studio-marketplace/d/vicanent.gcmp?color=green&label=Downloads)](https://marketplace.visualstudio.com/items?itemName=vicanent.gcmp)
> [![License](https://img.shields.io/github/license/VicBilibily/GCMP?color=orange&label=License)](https://github.com/VicBilibily/GCMP/blob/main/LICENSE)
>
> 通过集成国内顶尖的AI模型，为开发者提供更丰富、更适合的AI编程助手选择。

## ✨ 功能特点

- 🔗 **GitHub Copilot Chat 集成** - 专为 GitHub Copilot
  Chat 的 Ollama 接入设计和优化
- 🔄 **API转换** - 将不同AI提供商的API统一转换为Ollama兼容格式
- 🌐 **多提供商支持** - 集成火山方舟、阿里云百炼、DeepSeek、腾讯云、OpenRouter等
- 🔥 **配置热重载** - 支持JSON配置文件的实时重载，无需重启服务
- 🛠️
  **工具兼容性** - 包含工具修复服务，确保Anthropic/Claude模型的工具调用正常工作
- 📝 **请求日志** - 详细的请求和响应日志记录，便于调试和监控
- 💻 **多平台支持** - 提供预编译的二进制文件，支持Windows、macOS、Linux

## 🎯 使用场景

本项目主要解决 GitHub Copilot
Chat 只支持 Ollama 本地模型的限制，通过代理服务让你可以：

- 在 GitHub Copilot Chat 中使用国内AI服务（火山方舟、阿里云百炼等）
- 访问 OpenRouter 聚合的各种国外模型（GPT-4、Claude、Gemini等）
- 无需修改 GitHub Copilot Chat 配置，只需将 Ollama 服务地址指向本代理

## 🚀 支持的AI提供商

目前支持以下AI服务提供商：

| 提供商          | 配置标识     | 说明                     |
| --------------- | ------------ | ------------------------ |
| 火山方舟引擎    | `volcengine` | 字节跳动的AI服务平台     |
| 阿里云百炼      | `dashscope`  | 阿里云的AI模型服务       |
| DeepSeek官方    | `deepseek`   | DeepSeek官方API          |
| 腾讯云DeepSeek  | `tencentds`  | 腾讯云托管的DeepSeek服务 |
| Moonshot AI     | `moonshot`   | Kimi大模型服务平台       |
| OpenRouter      | `openrouter` | 多模型聚合服务平台       |
| 魔搭社区        | `modelscope` | 阿里云开源模型社区 ⚠️    |
| 智谱AI BigModel | `bigmodel`   | 智谱AI GLM-4.5系列模型   |

> **⚠️ 魔搭社区特别提示**：使用前需在 [ModelScope官网](https://modelscope.cn/)
> 绑定阿里云账号，否则会出现401认证错误。

每个提供商需要在配置文件中设置相应的API密钥和端点信息。

## 📦 快速开始

### 使用预编译版本（推荐）

1. 从
   [Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
   下载对应平台的压缩包
2. 解压文件
3. 复制 `.env.example` 为 `.env` 并配置API密钥
4. 运行可执行文件
5. 在 GitHub Copilot Chat 中将 Ollama 服务地址设置为 `http://localhost:11434`

### 从源码运行

```bash
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy
npm install
cp .env.example .env  # 编辑配置 API Keys
npm run dev
```

```bash
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy
npm install
cp .env.example .env
# 编辑 .env 文件，配置API密钥
npm run dev
# 在 GitHub Copilot Chat 中设置 Ollama 地址为 http://localhost:11434
```

## ⚙️ 配置说明

### 环境变量配置

在 `.env` 文件中配置服务端口和API密钥：

```env
# 服务配置
PORT=11434

# AI 提供商 API Keys（至少配置一个）
VOLCENGINE_API_KEY=your_volcengine_api_key_here
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
MOONSHOT_API_KEY=your_moonshot_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODELSCOPE_API_KEY=your_modelscope_api_key_here  # 需先绑定阿里云账号
BIGMODEL_API_KEY=your_bigmodel_api_key_here

# 可选配置
LOG_LEVEL=info
CHAT_LOGS=false
```

### 提供商配置

服务启动时会自动加载 `config/unified-providers.json`
中的提供商配置。支持配置文件的热重载，修改配置后无需重启服务。

## 📡 API接口

本服务提供完整的Ollama兼容API，专门为GitHub Copilot Chat设计：

### 主要接口

- `GET /` - 健康检查
- `GET /api/version` - 服务版本信息
- `GET /api/tags` - 获取可用模型列表（GitHub Copilot Chat 用于发现模型）
- `POST /api/show` - 显示模型详细信息
- `POST /v1/chat/completions` - OpenAI兼容的聊天接口（支持流式和非流式响应）

### GitHub Copilot Chat 集成

将本服务的地址（默认 `http://localhost:11434`）配置为 GitHub Copilot
Chat 的 Ollama 服务地址即可使用。

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

| 文档                                                           | 说明                       |
| -------------------------------------------------------------- | -------------------------- |
| 📖 [特性详解](./README/FEATURES.md)                            | 详细特性说明和功能介绍     |
| 🎯 [支持模型](./README/SUPPORTED_MODELS.md)                    | 完整的 AI 提供商和模型列表 |
| 📥 [安装指南](./README/INSTALLATION_GUIDE.md)                  | 详细安装和部署说明         |
| ⚙️ [配置参数](./README/CONFIGURATION.md)                       | 完整配置参数详解           |
| 🏗️ [开发指南](./README/DEVELOPMENT.md)                         | 项目架构和开发说明         |
| 🔧 [提供商配置](./docs/PROVIDER_CONFIGURATION.md)              | API密钥配置指南            |
| 📋 [模型配置规范](./docs/MODEL_CONFIG_SPECIFICATION.md)        | 模型配置文件格式           |
| 🤖 [OpenRouter模型生成](./docs/OPENROUTER_MODEL_GENERATION.md) | OpenRouter模型自动生成指南 |
| 🔄 [配置热重载](./docs/CONFIG_HOT_RELOAD.md)                   | 配置热重载功能说明         |
| 💬 [消息处理规则](./docs/MESSAGE_PROCESSING_RULES.md)          | 消息处理规则配置           |
| 🛡️ [工具修复指南](./docs/TOOL_REPAIR_GUIDE.md)                 | 工具修复功能说明           |
| 🚀 [自动发布指南](./docs/AUTO_RELEASE_GUIDE.md)                | CI/CD 自动化发布流程       |

## 🔧 故障排除

遇到问题时：

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

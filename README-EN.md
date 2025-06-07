# 🚀 Universal AI Model Proxy - Ollama Compatible Interface

[![CI](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml)
[![Release](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/VicBilibily/universal-ollama-proxy)](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Unified adapter architecture based on OpenAI SDK** that consolidates multiple
AI service providers into an Ollama-compatible interface, **specifically
optimized for GitHub Copilot Chat's Ollama integration**.

> **🎯 Design Purpose**: This project is designed specifically for GitHub
> Copilot Chat's Ollama integration, providing the compatible interfaces that it
> requires.

## ✨ Core Features

- 🏗️ **Unified Architecture** - OpenAI SDK-based unified adapter service with
  complete TypeScript type safety
- 🔄 **Configuration Management** - Hot-reload configuration files, dynamic
  provider loading, secure environment variable management
- 📊 **Monitoring & Logging** - Detailed request/response logs, performance
  monitoring, error tracking
- 🛠️ **Message Processing** - Custom filtering rules, format conversion, perfect
  GitHub Copilot Chat compatibility
- 🛡️ **Tool Filtering** - Security protection, rule engine, format conversion,
  performance optimization
- 🌍 **Multi-Platform** - Pre-compiled binaries for all major platforms,
  dependency-free execution, automated build & release

## 🎯 Supported AI Providers

| Provider                     | Models | Key Features                       |
| ---------------------------- | ------ | ---------------------------------- |
| 🔥 **VolcEngine**            | 12+    | Doubao LLM, Deep Thinking, Vision  |
| 🚀 **Alibaba Cloud (China)** | 8+     | Qwen Series, Vision Understanding  |
| 🔥 **Tencent DeepSeek**      | 5+     | DeepSeek R1, V3, Prover            |
| 🎯 **DeepSeek Official**     | 2+     | Chat Models, Reasoning Models      |
| 🌐 **OpenRouter**            | 15+    | GPT-4o, Claude, Gemini Aggregation |

## 📥 Quick Start

### 🎯 Method 1: Pre-compiled Binaries (Recommended)

1. Download the appropriate platform package from
   [Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
2. Extract and configure the `.env` file (at least one API Key required)
3. Run the executable file
4. Visit http://localhost:11434 to verify the service

### 🛠️ Method 2: Source Installation

```bash
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy
npm install
cp .env.example .env  # Edit to configure API Keys
npm run dev
```

## ⚙️ Basic Configuration

Configure at least one AI provider's API Key in the `.env` file:

```env
# Service Configuration
PORT=11434

# AI Provider API Keys (at least one required)
VOLCENGINE_API_KEY=your_volcengine_api_key_here
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Logging Configuration
LOG_LEVEL=info
CHAT_LOGS=false
```

## 📡 API Interfaces

### Ollama Compatible Interface

- `GET /` - Health check and service status
- `GET /api/version` - Get service version information
- `GET /api/tags` - Get available model list
- `POST /api/show` - Show specific model information

### OpenAI Compatible Interface

- `POST /v1/chat/completions` - Chat completion interface
  (streaming/non-streaming)

**Model Call Format**: `provider:model`, e.g.,
`volcengine:doubao-1.5-pro-32k-250115`

## 🛠️ Development & Deployment

### Development Commands

```bash
npm run dev          # Development mode (hot reload)
npm run build        # Build project
npm run format       # Code formatting
npm run check        # Verify configuration and environment
```

### Build & Release

```bash
npm run build:binaries    # Build binaries for all platforms
npm run release          # Complete release process
npm run quick:build      # Interactive quick build
```

## 🔧 Troubleshooting

Having issues? Check the
**[Troubleshooting Guide](./README/TROUBLESHOOTING.md)** for common problem
solutions.

Or:

1. Run `npm run check` to verify configuration
2. Set `LOG_LEVEL=debug` to view detailed logs
3. Go to
   [GitHub Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues)
   to report problems

## 🚀 Automated Release

This project supports automated GitHub Release builds:

1. Create a new GitHub Release
2. Wait 3-5 minutes
3. All platform packages are automatically generated 🎉

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).

---

<div align="center">

### 🌟 If this project helps you, please give it a Star ⭐

**Made with ❤️ for the AI community**

[🏠 Homepage](https://github.com/VicBilibily/universal-ollama-proxy) |
[📖 Documentation](./README/) |
[🐛 Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues) |
[🚀 Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases)

</div>

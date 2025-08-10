# Universal Ollama Proxy

[![CI](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/ci.yml)
[![Release](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml/badge.svg)](https://github.com/VicBilibily/universal-ollama-proxy/actions/workflows/release.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/VicBilibily/universal-ollama-proxy)](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A proxy service specifically designed for GitHub Copilot Chat's Ollama
integration. Converts multiple AI service provider APIs to Ollama-compatible
format, enabling you to use different AI models within GitHub Copilot Chat.
Built with TypeScript and OpenAI SDK.

## ✨ Features

- 🔗 **GitHub Copilot Chat Integration** - Specifically designed and optimized
  for GitHub Copilot Chat's Ollama integration
- 🔄 **API Conversion** - Converts different AI provider APIs to
  Ollama-compatible format
- 🌐 **Multi-Provider Support** - Integrates VolcEngine, Alibaba Cloud
  DashScope, DeepSeek, Tencent Cloud, OpenRouter, and more
- 🔥 **Configuration Hot Reload** - Supports real-time JSON configuration file
  reloading without service restart
- 🛠️ **Tool Compatibility** - Includes tool repair service ensuring proper tool
  calls for Anthropic/Claude models
- 📝 **Request Logging** - Detailed request and response logging for debugging
  and monitoring
- 💻 **Multi-Platform Support** - Provides pre-compiled binaries for Windows,
  macOS, and Linux

## 🎯 Use Cases

This project primarily solves GitHub Copilot Chat's limitation of only
supporting local Ollama models. Through this proxy service, you can:

- Use Chinese AI services (VolcEngine, Alibaba Cloud DashScope, etc.) in GitHub
  Copilot Chat
- Access various international models aggregated by OpenRouter (GPT-4, Claude,
  Gemini, etc.)
- No need to modify GitHub Copilot Chat configuration - simply point the Ollama
  service address to this proxy

## 🚀 Supported AI Providers

Currently supports the following AI service providers:

| Provider                | Config ID    | Description                           |
| ----------------------- | ------------ | ------------------------------------- |
| VolcEngine              | `volcengine` | ByteDance's AI service platform       |
| Alibaba Cloud DashScope | `dashscope`  | Alibaba Cloud's AI model service      |
| DeepSeek Official       | `deepseek`   | DeepSeek official API                 |
| Tencent Cloud DeepSeek  | `tencentds`  | Tencent Cloud hosted DeepSeek service |
| Moonshot AI             | `moonshot`   | Kimi AI service platform              |
| OpenRouter              | `openrouter` | Multi-model aggregation platform      |
| ModelScope              | `modelscope` | Alibaba Cloud open source community   |

Each provider requires setting corresponding API keys and endpoint information
in the configuration file.

## 📦 Quick Start

### Using Pre-compiled Binaries (Recommended)

1. Download the corresponding platform package from
   [Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
2. Extract the files
3. Copy `.env.example` to `.env` and configure API keys
4. Run the executable file
5. Set the Ollama service address in GitHub Copilot Chat to
   `http://localhost:11434`

### Running from Source

```bash
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy
npm install
cp .env.example .env
# Edit .env file to configure API keys
npm run dev
# Set Ollama address in GitHub Copilot Chat to http://localhost:11434
```

## ⚙️ Configuration

### Environment Variables

Configure service port and API keys in the `.env` file:

```env
# Service configuration
PORT=11434

# AI Provider API Keys (at least one required)
VOLCENGINE_API_KEY=your_volcengine_api_key_here
DASHSCOPE_API_KEY=your_dashscope_api_key_here
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODELSCOPE_API_KEY=your_modelscope_api_key_here

# Optional configuration
LOG_LEVEL=info
CHAT_LOGS=false
```

### Provider Configuration

The service automatically loads provider configurations from
`config/unified-providers.json` on startup. Supports configuration file hot
reloading - no service restart required when modifying configurations.

## 📡 API Endpoints

This service provides complete Ollama-compatible APIs, specifically designed for
GitHub Copilot Chat:

### Main Endpoints

- `GET /` - Health check
- `GET /api/version` - Service version information
- `GET /api/tags` - Get available model list (used by GitHub Copilot Chat for
  model discovery)
- `POST /api/show` - Show model details
- `POST /v1/chat/completions` - OpenAI-compatible chat interface (supports
  streaming and non-streaming responses)

### GitHub Copilot Chat Integration

Configure this service's address (default `http://localhost:11434`) as the
Ollama service address in GitHub Copilot Chat to start using it.

## 🛠️ Development

### Local Development

```bash
npm run dev          # Development mode (hot reload)
npm run build        # Build project
npm run start        # Start production version
npm run format       # Code formatting
```

### Build Release

```bash
npm run build:binaries    # Build binaries for all platforms
npm run release          # Complete release process
npm run quick:build      # Interactive quick build
```

## 📚 Documentation

| Document                                                           | Description                                |
| ------------------------------------------------------------------ | ------------------------------------------ |
| [Features](./README/FEATURES.md)                                   | Detailed feature descriptions              |
| [Supported Models](./README/SUPPORTED_MODELS.md)                   | Complete AI provider and model list        |
| [Installation Guide](./README/INSTALLATION_GUIDE.md)               | Detailed installation and deployment guide |
| [Configuration](./README/CONFIGURATION.md)                         | Complete configuration parameter reference |
| [Development Guide](./README/DEVELOPMENT.md)                       | Project architecture and development guide |
| [Provider Configuration](./docs/PROVIDER_CONFIGURATION.md)         | API key configuration guide                |
| [Model Config Specification](./docs/MODEL_CONFIG_SPECIFICATION.md) | Model configuration file format            |
| [Config Hot Reload](./docs/CONFIG_HOT_RELOAD.md)                   | Configuration hot reload functionality     |
| [Message Processing Rules](./docs/MESSAGE_PROCESSING_RULES.md)     | Message processing rule configuration      |
| [Tool Repair Guide](./docs/TOOL_REPAIR_GUIDE.md)                   | Tool repair functionality guide            |
| [Auto Release Guide](./docs/AUTO_RELEASE_GUIDE.md)                 | CI/CD automated release process            |

## 🔧 Troubleshooting

When encountering issues:

1. Run `npm run check` to verify configuration
2. Set `LOG_LEVEL=debug` to view detailed logs
3. Report issues at
   [GitHub Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues)

## Automated Release

This project supports automated GitHub Release builds:

1. Create a new GitHub Release
2. Wait 3-5 minutes
3. All platform packages are automatically generated 🎉

## License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">

### 🌟 If this project helps you, please give it a Star ⭐

**Made with ❤️ for the AI community**

[🏠 Homepage](https://github.com/VicBilibily/universal-ollama-proxy) |
[📖 Documentation](./README/) |
[🐛 Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues) |
[🚀 Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases)

</div>

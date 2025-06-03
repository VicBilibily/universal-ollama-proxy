# AI 模型统一代理 - Ollama 兼容接口

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

## 快速开始

### 1. 安装与配置

```bash
# 克隆项目
git clone <repository-url>
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

### 使用 Ollama 客户端

```bash
# 设置环境变量
$env:OLLAMA_HOST = "http://localhost:11434"

# 查看可用模型
ollama list

# 开始对话
ollama run doubao-1.5-pro-32k-250115
```

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

| 变量名               | 说明                   | 必需 |
| -------------------- | ---------------------- | ---- |
| `PORT`               | 服务器端口             | ❌   |
| `VOLCENGINE_API_KEY` | 火山方舟引擎 API Key   | ⚠️   |
| `DASHSCOPE_API_KEY`  | 阿里云百炼 API Key     | ⚠️   |
| `TENCENTDS_API_KEY`  | 腾讯云DeepSeek API Key | ⚠️   |
| `DEEPSEEK_API_KEY`   | DeepSeek官方 API Key   | ⚠️   |

> 至少需要配置一个 API Key

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
```

## 故障排除

1. **认证失败** - 检查 API Key 配置
2. **模型不可用** - 确认模型已开通
3. **网络问题** - 检查防火墙设置
4. **配置问题** - 运行 `npm run check`

## 许可证

MIT License

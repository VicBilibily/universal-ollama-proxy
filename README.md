# AI 模型统一代理 - Ollama 兼容接口

这是一个统一的 AI 模型代理服务，将多个 AI 服务提供商（火山方舟引擎豆包、阿里云百炼通义千问、腾讯云DeepSeek、DeepSeek官方）的 API 转换为 Ollama 兼容接口。

## 🚀 功能特性

### ✅ **统一适配器架构**

- 使用 OpenAI SDK 统一处理所有 AI 服务提供商
- 支持火山方舟引擎（豆包）、阿里云百炼（通义千问）、腾讯云DeepSeek、DeepSeek官方
- 可扩展架构，易于添加新的服务提供商
- 统一的错误处理和重试机制

### ✅ **完整的 Ollama API 兼容**

- `/api/chat` - 聊天对话接口（支持流式和非流式）
- `/api/generate` - 文本生成接口
- `/api/embeddings` - 文本嵌入接口
- `/api/tags` - 模型列表接口
- `/api/show` - 模型详情接口
- `/api/create` - 创建模型接口（占位）
- `/api/copy` - 复制模型接口（占位）
- `/api/delete` - 删除模型接口（占位）
- `/api/pull` - 拉取模型接口（占位）
- `/api/push` - 推送模型接口（占位）

### ✅ **OpenAI 兼容接口**

- `/v1/chat/completions` - OpenAI 格式聊天接口
- `/v1/models` - OpenAI 格式模型列表

### ✅ **支持的模型**

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

### ✅ **高级特性**

- 支持流式和非流式响应
- 完整的 TypeScript 类型定义
- 模块化架构，职责分离
- 统一的配置管理
- 健康检查和监控
- 支持自定义模型映射

✅ **生产就绪**

- TypeScript 编写，类型安全
- 完善的日志和监控
- 错误处理和优雅关闭
- 安全中间件集成

## 快速开始

### 1. 获取 API Keys

#### 火山方舟引擎 API Key

1. 访问
   [火山方舟引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
2. 创建新的 API Key
3. 复制并妥善保存您的 API Key

#### 阿里云百炼 API Key

1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/api-key)
2. 创建新的 API Key
3. 复制并妥善保存您的 API Key

#### 其他服务商 API Key

- **腾讯云DeepSeek**: 访问
  [腾讯云知识引擎](https://cloud.tencent.com/product/lke) 获取 API Key
- **DeepSeek官方**: 访问 [DeepSeek 控制台](https://platform.deepseek.com/)
  获取 API Key

### 2. 模型配置

项目已经预配置了所有四个供应商的推荐模型，您可以直接使用预设的模型名称，也可以根据需要自定义配置：

#### 火山方舟引擎模型配置

1. 访问 [模型列表](https://www.volcengine.com/docs/82379/1330310)
   选择您要使用的模型
2. 在
   [开通管理页面](https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement)
   开通对应模型服务
3. 获取模型的 Model ID（格式如：`ep-xxxxxxxxxx-xxxxx`）

#### 阿里云百炼模型配置

1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 在模型管理中开通需要使用的模型
3. 使用预设模型名称即可（如：`qwen-max`、`qwen-plus`等）

#### 腾讯云DeepSeek/DeepSeek官方配置

1. **腾讯云DeepSeek**：访问
   [腾讯云知识引擎](https://cloud.tencent.com/product/lke) 开通服务
2. **DeepSeek官方**：访问 [DeepSeek 控制台](https://platform.deepseek.com/)
   获取 API Key
3. 使用预设模型名称即可（如：`deepseek-chat`、`deepseek-r1`等）

### 3. 环境准备

确保您的系统已安装：

- Node.js 16+
- npm 或 yarn

### 4. 安装依赖

```bash
npm install
```

### 5. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的 API Keys：

```env
# 服务器配置
PORT=11434

# 火山方舟引擎配置
VOLCENGINE_API_KEY=your_volcengine_api_key_here

# 阿里云百炼配置
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# 腾讯云DeepSeek配置
TENCENTDS_API_KEY=your_tencent_deepseek_api_key_here

# DeepSeek官方配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 开发环境配置
NODE_ENV=development

# 日志级别
LOG_LEVEL=info
```

### 6. 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm run build
npm start
```

服务启动后，将在 `http://localhost:11434` 监听请求。

## 配置检查

在启动服务之前，您可以运行配置检查：

```bash
npm run check
```

这会检查：

- 环境变量是否正确设置
- 依赖包是否已安装
- 构建文件是否存在

## 测试 API

项目包含了完整的测试脚本：

### 快速测试

```bash
npm run test:api
```

### 运行示例

```bash
npm run examples
```

## API 使用示例

### 使用 Ollama 客户端

安装 Ollama 客户端后，可以直接连接到代理服务器：

```bash
# 设置 OLLAMA_HOST 环境变量
$env:OLLAMA_HOST = "http://localhost:11434"

# 查看可用模型
ollama list

# 开始对话（使用您的实际 Model ID）
ollama run ep-20241206112629-bd4lj
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
    "model": "ep-20241206112629-bd4lj",
    "messages": [
      {
        "role": "user",
        "content": "你好，请介绍一下自己"
      }
    ]
  }'
```

#### 流式聊天

```bash
curl -X POST http://localhost:11434/api/chat `
  -H "Content-Type: application/json" `
  -d '{
    "model": "ep-20241206112629-bd4lj",
    "messages": [
      {
        "role": "user",
        "content": "写一个简短的故事"
      }
    ],
    "stream": true
  }'
```

#### 文本生成

```bash
curl -X POST http://localhost:11434/api/generate `
  -H "Content-Type: application/json" `
  -d '{
    "model": "ep-20241206112629-bd4lj",
    "prompt": "解释什么是人工智能"
  }'
```

## 项目结构

```
src/
├── app.ts              # 主应用文件
├── index.ts            # 入口文件
├── config/             # 配置文件
│   └── index.ts
├── controllers/        # 控制器
│   └── ollama.ts
├── middleware/         # 中间件
│   └── index.ts
├── services/           # 服务层
│   ├── ollama.ts       # Ollama 服务
│   └── volcEngine.ts   # 火山方舟引擎服务
├── types/              # 类型定义
│   └── index.ts
└── utils/              # 工具函数
    └── index.ts
```

## 开发指南

### 构建项目

```bash
npm run build
```

### 开发模式（自动重启）

```bash
npm run dev:watch
```

### 清理构建文件

```bash
npm run clean
```

## 部署

### Docker 部署

#### 开发环境

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑 .env 文件，填入您的 API Keys

# 3. 启动开发环境
docker-compose up -d

# 4. 查看日志
docker-compose logs -f ai-ollama-proxy

# 5. 停止服务
docker-compose down
```

#### 生产环境

```bash
# 1. 配置环境变量
cp .env.example .env

# 2. 使用生产配置启动
docker-compose -f docker-compose.prod.yml up -d

# 3. 查看运行状态
docker-compose -f docker-compose.prod.yml ps

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f ai-ollama-proxy
```

#### 手动构建和运行

```bash
# 构建镜像
docker build -t ai-ollama-proxy:latest .

# 运行容器
docker run -d \
  --name ai-ollama-proxy \
  -p 11434:11434 \
  --env-file .env \
  --restart unless-stopped \
  ai-ollama-proxy:latest
```

### 传统部署

#### 直接运行

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务
npm start
```

## 配置说明

### 环境变量

| 变量名               | 说明                   | 默认值        | 必需 |
| -------------------- | ---------------------- | ------------- | ---- |
| `PORT`               | 服务器端口             | `11434`       | ❌   |
| `VOLCENGINE_API_KEY` | 火山方舟引擎 API Key   | -             | ⚠️   |
| `DASHSCOPE_API_KEY`  | 阿里云百炼 API Key     | -             | ⚠️   |
| `TENCENTDS_API_KEY`  | 腾讯云DeepSeek API Key | -             | ⚠️   |
| `DEEPSEEK_API_KEY`   | DeepSeek官方 API Key   | -             | ⚠️   |
| `NODE_ENV`           | 运行环境               | `development` | ❌   |
| `LOG_LEVEL`          | 日志级别               | `info`        | ❌   |

> **⚠️ 注意**: 至少需要配置一个 API Key，系统会自动选择可用的服务提供商。

## 故障排除

### 常见问题

1. **认证失败**

   - 检查 API
     Key 是否正确设置（`VOLCENGINE_API_KEY`、`DASHSCOPE_API_KEY`、`TENCENTDS_API_KEY`、`DEEPSEEK_API_KEY`）
   - 确认 API Key 有效且未过期
   - 确认对应服务商账户有足够的配额
   - 至少需要配置一个有效的 API Key

2. **模型不可用**

   - 确认 Model ID 在您的火山方舟引擎控制台中存在
   - 检查模型是否已正确开通
   - 确认模型 ID 格式正确（如：`ep-xxxxxxxxxx-xxxxx`）

3. **网络连接问题**

   - 确认网络连接正常
   - 检查防火墙设置

4. **配置问题**
   - 运行 `npm run check` 检查配置
   - 确认 `.env` 文件存在且格式正确
   - 检查环境变量是否正确加载

### 日志查看

服务会输出详细的日志信息，包括：

- 请求处理日志
- 错误信息
- 性能统计

在开发模式下会显示调试信息。

### 获取帮助

1. 查看火山方舟引擎官方文档：[快速入门](https://www.volcengine.com/docs/82379/1399008)
2. 检查您的 API Key 和模型配置
3. 在项目 GitHub 页面创建 Issue

## VS Code 任务

项目包含了预配置的 VS Code 任务：

- **启动开发服务器** - 启动开发模式
- **构建项目** - 编译 TypeScript
- **运行 API 测试** - 执行 API 测试
- **检查配置** - 验证环境配置

按 `Ctrl+Shift+P`，输入 "Tasks: Run Task" 来使用这些任务。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 支持

如有问题，请在 GitHub 上创建 Issue。

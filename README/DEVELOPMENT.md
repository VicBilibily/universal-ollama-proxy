# 🏗️ 开发指南

本文档提供 Universal Ollama Proxy 的开发环境搭建、项目架构说明和开发工作流程。

## 📚 项目架构

### 🏗️ 项目结构

```
universal-ollama-proxy/
├── 📁 src/                    # 源代码目录
│   ├── app.ts                 # 主应用程序
│   ├── index.ts               # 程序入口点
│   ├── polyfills.ts           # 环境兼容性垫片
│   ├── 📁 config/             # 配置管理
│   │   └── index.ts           # 配置管理器实现
│   ├── 📁 controllers/        # 控制器层
│   │   ├── ollama.ts          # Ollama API 控制器
│   │   └── openai.ts          # OpenAI API 控制器
│   ├── 📁 middleware/         # 中间件
│   │   ├── errorHandler.ts    # 错误处理中间件
│   │   ├── index.ts           # 中间件导出
│   │   ├── requestLogger.ts   # 请求日志中间件
│   │   ├── streamResponse.ts  # 流式响应处理
│   │   └── validateRequest.ts # 请求验证中间件
│   ├── 📁 services/           # 服务层
│   │   ├── configHotReload.ts # 配置热重载服务
│   │   ├── configReloader.ts  # 配置重载处理器
│   │   ├── modelDiscovery.ts  # 模型发现服务
│   │   ├── ollama.ts          # Ollama 服务
│   │   ├── openai.ts          # OpenAI 兼容服务
│   │   ├── toolRepair.ts      # 工具修复服务
│   │   └── unifiedAdapter.ts  # 统一适配器服务（核心）
│   ├── 📁 types/              # TypeScript 类型定义
│   │   ├── index.ts           # 类型导出
│   │   ├── models.ts          # 模型相关类型
│   │   ├── ollama.ts          # Ollama API 类型
│   │   ├── openai.ts          # OpenAI API 类型
│   │   ├── toolRepair.ts      # 工具修复类型
│   │   └── unifiedAdapter.ts  # 统一适配器类型
│   └── 📁 utils/              # 工具函数
│       ├── chatLogger.ts      # 聊天日志记录
│       ├── index.ts           # 工具函数导出
│       ├── jsonParser.ts      # JSON 解析工具
│       ├── messageProcessor.ts  # 消息处理器
│       └── requestQueue.ts    # 请求队列管理
├── 📁 config/                 # 配置文件目录
├── 📁 docs/                   # 功能文档
├── 📁 README/                 # README相关文档
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

## 🛠️ 开发环境搭建

### 📋 前置要求

- **Node.js**: 16.x 或更高版本
- **npm**: 7.x 或更高版本
- **Git**: 用于版本控制
- **VS Code**: 推荐的开发环境

### 🔧 快速搭建

```bash
# 1. 克隆项目
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置至少一个 API Key

# 4. 启动开发服务
npm run dev
```

### 🔍 VS Code 配置

推荐安装以下 VS Code 扩展：

- **TypeScript**: 类型检查和智能提示
- **Prettier**: 代码格式化
- **ESLint**: 代码质量检查
- **Git Lens**: Git 历史和注释

## 📦 开发命令

### 🚀 基础开发命令

```bash
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

```bash
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

```bash
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

```bash
# 直接运行脚本
node scripts/build-info.js          # 显示构建信息
node scripts/quick-build.js         # 交互式快速构建
node scripts/test-all-models.js     # 测试所有模型
node scripts/check-setup.js         # 检查环境配置
node scripts/validate-release.js    # 验证发布版本
```

## 🔄 开发工作流

### 📝 标准工作流

1. **功能开发**

   ```bash
   # 创建功能分支
   git checkout -b feature/new-feature

   # 开发模式
   npm run dev

   # 代码格式化
   npm run format

   # 提交更改
   git add .
   git commit -m "feat: add new feature"
   ```

2. **测试验证**

   ```bash
   # 验证配置
   npm run check

   # 构建测试
   npm run build

   # 测试模型连接
   npm run test-all-models-chat
   ```

3. **提交代码**

   ```bash
   # 推送到远程分支
   git push origin feature/new-feature

   # 创建 Pull Request
   ```

### 🏷️ 发布流程

1. **本地发布测试**

   ```bash
   # 完整发布流程测试
   npm run release

   # 验证发布包
   npm run verify:releases
   ```

2. **GitHub 发布**

   ```bash
   # 创建版本标签
   git tag v1.0.3
   git push origin v1.0.3

   # 或直接在 GitHub 创建 Release
   ```

## 🧩 核心模块说明

### 📡 UnifiedAdapterService

**位置**: `src/services/unifiedAdapter.ts`

**功能**:

- 统一所有 AI 提供商的接口适配
- 请求路由和响应处理
- 错误处理和重试机制

**关键方法**:

```typescript
async processRequest(request: ChatRequest): Promise<ChatResponse>
async streamRequest(request: ChatRequest): AsyncGenerator<ChatChunk>
```

### 🔍 ModelDiscoveryService

**位置**: `src/services/modelDiscovery.ts`

**功能**:

- 动态发现可用模型
- 模型状态监控
- 提供商管理

**关键方法**:

```typescript
async discoverModels(): Promise<Model[]>
async validateProvider(provider: string): Promise<boolean>
```

### 🔄 ConfigHotReloadService

**位置**: `src/services/configHotReload.ts`

**功能**:

- 配置文件监控
- 热重载机制
- 配置验证

**关键方法**:

```typescript
async watchConfigFiles(): Promise<void>
async reloadConfig(filePath: string): Promise<void>
```

## 🔧 API 开发

### 📡 添加新的 AI 提供商

1. **创建提供商配置**

   ```json
   // config/new-provider-models.json
   {
     "provider": "new-provider",
     "baseUrl": "https://api.new-provider.com",
     "models": [
       {
         "id": "new-provider:model-name",
         "name": "Model Name",
         "maxTokens": 4096
       }
     ]
   }
   ```

2. **更新统一提供商配置**

   ```json
   // config/unified-providers.json
   {
     "providers": {
       "new-provider": {
         "configFile": "new-provider-models.json",
         "apiKeyEnv": "NEW_PROVIDER_API_KEY"
       }
     }
   }
   ```

3. **添加类型定义**
   ```typescript
   // src/types/providers.ts
   export interface NewProviderConfig {
     apiKey: string;
     baseUrl: string;
     models: Model[];
   }
   ```

### 🔌 添加新的 API 端点

1. **创建控制器**

   ```typescript
   // src/controllers/new-endpoint.ts
   import { Request, Response } from 'express';

   export async function handleNewEndpoint(req: Request, res: Response) {
     // 处理逻辑
   }
   ```

2. **注册路由**

   ```typescript
   // src/app.ts
   import { handleNewEndpoint } from './controllers/new-endpoint';

   app.get('/api/new-endpoint', handleNewEndpoint);
   ```

## 🧪 测试和调试

### 🔍 调试模式

```bash
# 启用详细调试日志
LOG_LEVEL=debug npm run dev

# 启用聊天日志记录
CHAT_LOGS=true npm run dev

# 查看日志文件
# 使用 VS Code 或其他编辑器查看 logs/chat/ 目录下的日志文件
code logs/chat/
```

### 🧪 测试工具

```bash
# 测试单个模型
curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "volcengine:doubao-1.5-pro-32k-250115",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 测试模型列表
curl http://localhost:11434/api/tags

# 健康检查
curl http://localhost:11434/
```

## 📊 性能优化

### 🚀 构建优化

- 使用 `pkg` 构建单文件可执行程序
- 支持多平台交叉编译
- 自动压缩和打包

### 💾 内存优化

- 流式响应处理，减少内存占用
- 智能垃圾回收
- 配置文件缓存机制

### 🌐 网络优化

- 连接池管理
- 请求去重
- 智能重试机制

---

## 📚 相关文档

- [返回主页](../README.md)
- [详细特性说明](./FEATURES.md)
- [支持的模型](./SUPPORTED_MODELS.md)
- [安装指南](./INSTALLATION_GUIDE.md)
- [配置参数详解](./CONFIGURATION.md)

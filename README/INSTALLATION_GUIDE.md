# 📥 安装指南

本文档提供 Universal Ollama
Proxy 的详细安装说明，包括预编译版本和源码安装两种方式。

## 🎯 方式一：预编译版本（推荐）

**无需 Node.js 环境**，直接从
[Releases](https://github.com/VicBilibily/universal-ollama-proxy/releases/latest)
下载预编译包。

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

# Moonshot AI API Key
MOONSHOT_API_KEY=your_moonshot_api_key_here

# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 魔搭社区 API Key
MODELSCOPE_API_KEY=your_modelscope_api_key_here
```

**⚠️ 魔搭社区特殊要求**：

使用魔搭社区API前，需要先在 [ModelScope官网](https://modelscope.cn/)
完成以下步骤：

1. 注册魔搭社区账号
2. **绑定阿里云账号**（必需步骤）
3. 在个人设置中获取API Token

> 未绑定阿里云账号将导致401认证错误

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

服务启动后，可以通过以下方式验证：

**验证服务运行状态：**

- **健康检查**: http://localhost:11434
- **模型列表**: http://localhost:11434/api/tags

### 📁 预编译包内容

每个压缩包都包含：

- ✅ **独立可执行文件**（无需 Node.js 环境）
- ✅ **完整配置文件** (`config/` 目录)
- ✅ **环境变量示例** (`.env.example`)
- ✅ **使用说明文档**

## 🛠️ 方式二：源码安装

如果需要从源码编译、进行开发或自定义配置，请使用以下方式：

### 📋 前置要求

- **Node.js**: 16.x 或更高版本
- **npm**: 7.x 或更高版本
- **Git**: 用于克隆仓库

### 🔧 安装步骤

#### 1️⃣ 克隆项目

```bash
# 克隆仓库
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy

# 安装依赖
npm install
```

#### 2️⃣ 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
# Windows
notepad .env
# Linux/macOS
nano .env
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
MOONSHOT_API_KEY=your_moonshot_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODELSCOPE_API_KEY=your_modelscope_api_key_here

# 可选配置
LOG_LEVEL=info
CHAT_LOGS=false
CHAT_LOGS_DIR=logs/chat
```

**⚠️ 魔搭社区API使用注意事项**：

使用`MODELSCOPE_API_KEY`前必须完成阿里云账号绑定，详见[提供商配置指南](../docs/PROVIDER_CONFIGURATION.md#7-魔搭社区-modelscope)。

#### 4️⃣ 启动服务

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run build
npm start
```

### 🔍 验证安装

服务启动后，可以通过以下方式验证：

**方式一：使用内置检查命令**

```bash
# 运行服务状态检查
npm run check
```

**方式二：直接访问服务端点**

- **健康检查**: http://localhost:11434
- **模型列表**: http://localhost:11434/api/tags
- **服务版本**: http://localhost:11434/api/version

## 🐳 Docker 安装

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/VicBilibily/universal-ollama-proxy.git
cd universal-ollama-proxy

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置 API Keys

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 使用 Docker

```bash
# 构建镜像
docker build -t universal-ollama-proxy .

# 运行容器
docker run -d \
  --name universal-ollama-proxy \
  -p 11434:11434 \
  --env-file .env \
  universal-ollama-proxy

# 查看日志
docker logs -f universal-ollama-proxy
```

## 🔧 常见安装问题

### Node.js 版本问题

**问题**: Node.js 版本过低导致安装失败

**解决方案**:

```bash
# 检查 Node.js 版本
node --version

# 如果版本低于 16.x，请升级到最新 LTS 版本
# 推荐使用 nvm 管理 Node.js 版本
```

### 依赖安装问题

**问题**: npm install 失败

**解决方案**:

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 或使用 yarn
yarn install
```

### 权限问题

**问题**: 二进制文件无法执行

**解决方案**:

```bash
# Linux/macOS 赋予执行权限
chmod +x universal-ollama-proxy-*

# Windows 可能被安全软件拦截，请添加信任
```

---

## 📚 相关文档

- [返回主页](../README.md)
- [详细特性说明](./FEATURES.md)
- [支持的模型](./SUPPORTED_MODELS.md)
- [配置参数详解](./CONFIGURATION.md)
- [开发指南](./DEVELOPMENT.md)

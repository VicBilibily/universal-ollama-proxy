# 多平台可执行文件构建指南

本项目支持构建为多个平台的独立可执行文件，无需安装 Node.js 即可运行。

## 支持的平台

- **Windows**: x64, ARM64
- **Linux**: x64, ARM64
- **macOS**: x64, ARM64

## 构建命令

### 1. 构建所有平台

```bash
# 方法一：使用自定义构建脚本（推荐）
npm run build:binaries

# 方法二：使用 pkg 命令
npm run pkg:build
```

### 2. 构建特定平台

```bash
# Windows x64
npm run pkg:win

# Linux x64
npm run pkg:linux

# macOS x64
npm run pkg:mac

# ARM64 版本
npm run pkg:win-arm
npm run pkg:linux-arm
npm run pkg:mac-arm
```

### 3. 使用自定义构建脚本

```bash
# 构建所有平台
node scripts/build-binaries.js

# 只构建 Windows 平台
node scripts/build-binaries.js windows

# 构建 Linux 和 macOS
node scripts/build-binaries.js linux macos

# 查看帮助
node scripts/build-binaries.js --help
```

## 输出文件

构建完成后，可执行文件将保存在 `binaries/` 目录中：

```
binaries/
├── universal-ollama-proxy-win-x64.exe      # Windows x64
├── universal-ollama-proxy-win-arm64.exe    # Windows ARM64
├── universal-ollama-proxy-linux-x64        # Linux x64
├── universal-ollama-proxy-linux-arm64      # Linux ARM64
├── universal-ollama-proxy-macos-x64        # macOS x64
└── universal-ollama-proxy-macos-arm64      # macOS ARM64
```

## 运行可执行文件

### Windows

```cmd
.\binaries\universal-ollama-proxy-win-x64.exe
```

### Linux/macOS

```bash
chmod +x ./binaries/universal-ollama-proxy-linux-x64
./binaries/universal-ollama-proxy-linux-x64
```

## 配置文件

可执行文件会自动包含 `config/` 目录中的配置文件。确保在运行前：

1. 复制 `config/` 目录到可执行文件同级目录
2. 设置相应的环境变量（如 API_KEY 等）

## 注意事项

1. **文件大小**: 可执行文件较大（约 50-100MB），因为包含了 Node.js 运行时
2. **权限**: Linux/macOS 下需要给可执行文件添加执行权限
3. **配置**: 确保配置文件和环境变量正确设置
4. **网络**: 首次构建时可能需要下载 Node.js 二进制文件

## 故障排除

### 构建失败

```bash
# 清理并重新构建
npm run clean
npm run build
npm run build:binaries
```

### 缺少依赖

```bash
# 重新安装依赖
npm install
```

### pkg 版本问题

如果遇到兼容性问题，可以尝试降级 pkg 版本：

```bash
npm install --save-dev pkg@5.6.0
```

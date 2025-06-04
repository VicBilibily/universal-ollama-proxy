# CI/CD 工作流说明

本项目包含三个 GitHub Actions 工作流，用于自动化构建、测试和发布流程。

## 📋 工作流概览

### 1. CI (持续集成) - `.github/workflows/ci.yml`

**触发条件:**

- 推送到 `main`、`master` 或 `develop` 分支
- 创建针对这些分支的 Pull Request

**功能:**

- 在多个 Node.js 版本 (16, 18, 20) 上运行测试
- 代码格式检查 (`npm run lint`)
- TypeScript 编译验证
- 跨平台构建测试 (Ubuntu, Windows, macOS)
- 测试二进制文件构建

### 2. Release Build and Deploy - `.github/workflows/release.yml`

**触发条件:**

- 发布新的 GitHub Release
- 手动触发 (可指定版本号)

**功能:**

- 构建所有平台的二进制文件
- 验证构建的二进制文件
- 创建发布包 (`.zip` 和 `.tar.gz`)
- 自动上传到 GitHub Release
- 生成详细的构建报告

## 🚀 使用指南

### 自动发布流程

#### 创建 GitHub Release 触发自动构建

1. 进入 GitHub 仓库的 "Releases" 页面
2. 点击 "Create a new release"
3. 输入标签版本（如：`v1.0.2`）
4. 填写发布标题和说明
5. 选择是否为预发布版本
6. 点击 "Publish release"

工作流会自动:

- ✅ 检查代码质量和格式
- ✅ 构建所有平台的二进制文件
- ✅ 验证构建产物完整性
- ✅ 创建发布包
- ✅ 上传到 GitHub Release

### 开发流程

1. **开发**: 在功能分支上进行开发
2. **测试**: 创建 Pull Request，CI 工作流会自动运行测试
3. **合并**: 合并到主分支后，CI 会再次验证
4. **发布**: 创建 GitHub Release 触发自动构建和发布

## 📦 发布产物

每次成功发布后，会生成以下文件:

### Windows

- `universal-ollama-proxy-v{version}-windows-x64.zip`
- `universal-ollama-proxy-v{version}-windows-arm64.zip`

### Linux

- `universal-ollama-proxy-v{version}-linux-x64.tar.gz`
- `universal-ollama-proxy-v{version}-linux-arm64.tar.gz`

### macOS

- `universal-ollama-proxy-v{version}-macos-x64.tar.gz`
- `universal-ollama-proxy-v{version}-macos-arm64.tar.gz`

## 🔍 故障排除

### 常见问题

1. **构建失败**: 检查 CI 日志，通常是依赖安装或编译错误
2. **发布失败**: 确保有适当的权限，检查 `GITHUB_TOKEN`
3. **版本冲突**: 确保版本号没有重复

### 查看日志

1. 进入 GitHub 仓库的 "Actions" 页面
2. 点击失败的工作流运行
3. 查看详细的执行日志
4. 根据错误信息进行修复

## ⚙️ 配置说明

### 权限要求

工作流需要以下权限:

- `contents: write` - 创建 release 和上传文件
- `pull-requests: read` - 读取 PR 信息

### 环境变量

- `GITHUB_TOKEN`: 自动提供，用于 GitHub API 操作

### 自定义配置

可以通过修改 `.github/workflows/` 下的 YAML 文件来自定义:

- Node.js 版本
- 构建平台
- 触发条件
- 发布说明模板

## 📄 相关文件

- `package.json`: 项目配置和版本信息
- `build-binaries.js`: 构建二进制文件脚本
- `create-release.js`: 创建发布包脚本
- `verify-binaries.js`: 验证二进制文件脚本

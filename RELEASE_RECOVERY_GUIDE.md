# 🔄 发布失败后重新发布指南

当GitHub Actions发布流程失败时，可以使用以下几种方法来重新发布版本。

## 🚨 常见发布失败原因

1. **网络连接问题** - GitHub Actions运行器网络不稳定
2. **权限问题** - GitHub Token权限不足
3. **文件匹配问题** - 构建产物路径或文件名不匹配
4. **构建环境问题** - 依赖安装失败或编译错误
5. **并发问题** - 多个相同版本的发布同时进行

## 🔧 重新发布方法

### 方法一：手动重新触发工作流 (推荐)

1. **访问GitHub Actions页面**

   ```
   https://github.com/VicBilibily/universal-ollama-proxy/actions
   ```

2. **选择工作流**

   - 点击左侧的 "Release Build and Deploy" 工作流

3. **手动触发**

   - 点击右上角的 "Run workflow" 按钮
   - 输入版本号（例如：`v1.0.2`）
   - 选择是否强制重新构建：
     - `false`: 如果文件已存在则跳过构建（节省时间）
     - `true`: 完全重新构建所有文件

4. **开始执行**
   - 点击绿色的 "Run workflow" 按钮开始执行

### 方法二：删除Release重新创建

1. **删除失败的Release**

   - 访问
     [Releases页面](https://github.com/VicBilibily/universal-ollama-proxy/releases)
   - 找到失败的版本，点击 "Edit"
   - 在编辑页面底部点击 "Delete release"
   - 确认删除

2. **删除对应的Tag**

   - 访问 [Tags页面](https://github.com/VicBilibily/universal-ollama-proxy/tags)
   - 找到对应的tag，点击删除

3. **重新创建Release**
   - 按照正常流程创建新的Release
   - 使用相同的版本号（如 `v1.0.2`）

### 方法三：本地构建上传

如果GitHub Actions持续失败，可以本地构建后手动上传：

1. **本地构建**

   ```powershell
   # 清理旧文件
   Remove-Item -Path "binaries" -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item -Path "releases" -Recurse -Force -ErrorAction SilentlyContinue

   # 安装依赖
   npm ci

   # 构建
   npm run build
   npm run build:binaries
   npm run create:release
   npm run verify:releases
   ```

2. **手动上传**
   - 访问现有的Release页面
   - 将 `releases/` 目录下的所有文件拖拽到Release的Assets区域

## 📋 发布前检查清单

### 环境检查

- [ ] Node.js 版本正确 (18.x)
- [ ] npm 依赖安装成功
- [ ] TypeScript 编译无错误
- [ ] 所有必需的脚本存在

### 版本检查

- [ ] 版本号格式正确 (使用 `v` 前缀，如 `v1.0.2`)
- [ ] 版本号在 `package.json` 中已更新
- [ ] 版本号与Release标签一致

### 权限检查

- [ ] GitHub Token 有 `contents: write` 权限
- [ ] 仓库设置允许Actions写入
- [ ] 没有保护分支阻止操作

## 🔍 故障排除

### 1. 权限错误：`Resource not accessible by integration`

**解决方法：**

- 检查仓库设置 → Actions → General → Workflow permissions
- 确保选择了 "Read and write permissions"
- 或者在工作流中明确指定权限：
  ```yaml
  permissions:
    contents: write
    packages: read
  ```

### 2. 文件匹配错误：`Pattern does not match any files`

**解决方法：**

- 检查 `releases/` 目录是否存在文件
- 确认文件名格式正确
- 使用通配符模式：`releases/universal-ollama-proxy-*.zip`

### 3. 构建失败

**解决方法：**

- 查看详细的构建日志
- 检查依赖是否正确安装
- 验证TypeScript代码无语法错误
- 确保所有必需的配置文件存在

### 4. 网络超时

**解决方法：**

- 重新运行工作流（通常第二次会成功）
- 使用手动触发而不是自动触发
- 检查GitHub Actions服务状态

## 📊 监控工具

### 使用内置监控脚本

```powershell
# 检查GitHub Actions状态
npm run monitor:actions

# 检查本地CI/CD状态
npm run check

# 验证发布流程
npm run validate:release
```

### 查看构建报告

每次发布后，系统会生成详细的构建报告：

- 在Actions页面下载 `build-report-{version}` artifact
- 包含完整的构建信息和文件列表

## 🎯 最佳实践

1. **版本号规范**

   - 始终使用 `v` 前缀（如 `v1.0.2`）
   - 遵循语义版本控制规范

2. **发布时机**

   - 避免在GitHub服务高峰期发布
   - 确保网络连接稳定

3. **备份策略**

   - 保留本地构建产物作为备份
   - 定期检查发布包完整性

4. **测试验证**
   - 发布前运行完整的验证流程
   - 确保所有测试通过

## 📞 获取帮助

如果问题仍然存在：

1. **查看日志**

   - GitHub Actions 详细日志
   - 本地构建输出

2. **检查状态**

   - [GitHub Status](https://www.githubstatus.com/)
   - Actions服务可用性

3. **社区支持**
   - GitHub Community Forum
   - 项目Issues页面

---

**记住：大多数发布失败都是临时性的网络或服务问题，重新运行通常可以解决！**

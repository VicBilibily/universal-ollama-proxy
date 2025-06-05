# 代码提交格式化指南

本项目使用 Husky 和 lint-staged 来自动化代码格式化流程，确保所有提交到仓库的代码都符合一致的代码风格标准。

## 自动化工具

- **Prettier**：用于统一代码格式化
- **Husky**：用于管理 Git hooks
- **lint-staged**：用于只处理暂存区中的文件

## 自动设置

当你首次克隆项目并运行 `npm install` 后，系统将自动设置 Git
hooks。这是通过 package.json 中的 `postinstall` 脚本实现的，它会调用
`scripts/setup-hooks.js` 来设置 pre-commit hook。

## 工作原理

当你尝试提交代码时：

1. Git 会触发 pre-commit hook
2. Husky 拦截这个事件并运行 `npx lint-staged`
3. lint-staged 只会对暂存区中的文件运行 Prettier 格式化
4. 格式化后的文件会自动添加回暂存区
5. 然后继续执行 commit 操作

这样，你提交的每一个文件都会被自动格式化，确保代码风格一致。

## 手动设置 (如果自动设置失败)

如果自动设置失败，你可以手动运行以下命令来设置 Git hooks：

```bash
# 安装依赖
npm install

# 初始化 Husky
npx husky install

# 创建 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# 给 pre-commit 文件添加执行权限
chmod +x .husky/pre-commit
```

## 跳过格式化

在某些特殊情况下，如果你需要跳过格式化检查并直接提交代码，可以使用 `--no-verify`
选项：

```bash
git commit -m "紧急修复" --no-verify
```

但请谨慎使用这个选项，尽量保持代码格式的一致性。

## 本地格式化命令

你也可以随时使用以下命令手动格式化代码：

- 格式化所有文件：`npm run format`
- 检查代码格式：`npm run lint`

## 注意事项

- 确保 `.husky` 目录已提交到代码仓库，这样团队成员克隆项目后可以共享相同的 Git
  hooks 配置。
- 如果你使用的是 Windows 系统，可能需要安装 Git
  Bash 或类似工具来确保 shell 脚本能正确执行。

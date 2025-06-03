#!/usr/bin/env node

/**
 * 项目重命名迁移脚本
 * 帮助用户从 volc-engine-ollama-proxy 迁移到 universal-ollama-proxy
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[迁移] ${message}`);
}

function renameFiles() {
  const binariesDir = 'binaries';

  if (!fs.existsSync(binariesDir)) {
    log('binaries 目录不存在，跳过文件重命名');
    return;
  }

  const files = fs.readdirSync(binariesDir);
  const oldFiles = files.filter(file => file.startsWith('volc-engine-ollama-proxy-'));

  if (oldFiles.length === 0) {
    log('没有找到需要重命名的旧文件');
    return;
  }

  log(`找到 ${oldFiles.length} 个需要重命名的文件:`);

  oldFiles.forEach(oldFile => {
    const newFile = oldFile.replace('volc-engine-ollama-proxy-', 'universal-ollama-proxy-');
    const oldPath = path.join(binariesDir, oldFile);
    const newPath = path.join(binariesDir, newFile);

    try {
      fs.renameSync(oldPath, newPath);
      log(`✅ ${oldFile} → ${newFile}`);
    } catch (error) {
      log(`❌ 重命名失败: ${oldFile} - ${error.message}`);
    }
  });
}

function updatePackageJson() {
  const packagePath = 'package.json';

  if (!fs.existsSync(packagePath)) {
    log('package.json 不存在');
    return;
  }

  try {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    if (packageJson.name === 'universal-ollama-proxy') {
      log('package.json 已经是新名称');
      return;
    }

    log('更新 package.json...');
    packageJson.name = 'universal-ollama-proxy';
    packageJson.description = '通用AI服务提供商 OpenAI 格式接口转换为 Ollama 本地接口代理服务，支持多个AI提供商';

    // 更新关键词
    packageJson.keywords = [
      'ollama',
      'universal-proxy',
      'multi-provider',
      'volc-engine',
      'dashscope',
      'deepseek',
      'tencent',
      'ai',
      'chatbot',
      'proxy',
      'typescript',
    ];

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    log('✅ package.json 已更新');
  } catch (error) {
    log(`❌ 更新 package.json 失败: ${error.message}`);
  }
}

function createMigrationGuide() {
  const guideContent = `# 项目重命名迁移指南

## 🔄 项目已重命名

**旧名称**: \`volc-engine-ollama-proxy\`
**新名称**: \`universal-ollama-proxy\`

## 📋 变更内容

### 1. 项目名称
- npm 包名: \`volc-engine-ollama-proxy\` → \`universal-ollama-proxy\`
- 可执行文件: \`volc-engine-ollama-proxy-*\` → \`universal-ollama-proxy-*\`

### 2. 项目定位
- **之前**: 专注于火山引擎适配
- **现在**: 支持多个AI服务提供商的通用代理

### 3. 支持的提供商
- 🔥 **火山引擎** (VolcEngine/Doubao)
- ☁️ **阿里云DashScope** (通义千问)
- 🧠 **深度求索** (DeepSeek)
- 🐧 **腾讯云** (TencentDS)
- 🔗 **统一适配器** (支持更多提供商)

## 🔧 迁移步骤

### 1. 自动迁移
运行迁移脚本:
\`\`\`bash
npm run migrate
\`\`\`

### 2. 手动迁移

#### 更新环境变量
除了原有的 \`VOLC_API_KEY\`，现在还支持:
\`\`\`
# 阿里云DashScope
DASHSCOPE_API_KEY=your_dashscope_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_key

# 腾讯云
TENCENTDS_API_KEY=your_tencent_key
\`\`\`

#### 更新脚本和引用
如果你有引用旧名称的脚本，请更新为新名称。

### 3. 重新构建
\`\`\`bash
# 清理旧文件
npm run clean

# 重新构建
npm run build:binaries
\`\`\`

## 📚 新功能

### 1. 多提供商支持
现在可以同时配置多个AI服务提供商，系统会根据模型名称自动路由到对应的服务。

### 2. 统一配置管理
所有提供商的配置都在 \`config/\` 目录下统一管理。

### 3. 更好的错误处理
改进了多提供商环境下的错误处理和日志记录。

## ⚠️ 注意事项

1. **兼容性**: 现有的火山引擎配置完全兼容，无需修改
2. **API接口**: 所有API接口保持不变
3. **配置文件**: 原有配置文件继续有效

## 🆘 需要帮助？

如果在迁移过程中遇到问题:
1. 检查控制台输出的错误信息
2. 确保所有依赖已正确安装
3. 查看项目文档获取最新信息

---

*此迁移是为了更好地反映项目的多提供商特性，感谢您的理解与支持！*
`;

  const guidePath = 'MIGRATION.md';
  fs.writeFileSync(guidePath, guideContent);
  log('✅ 创建迁移指南: MIGRATION.md');
}

function main() {
  log('开始项目重命名迁移...');

  // 1. 重命名二进制文件
  renameFiles();

  // 2. 更新 package.json
  updatePackageJson();

  // 3. 创建迁移指南
  createMigrationGuide();

  log('\n🎉 迁移完成！');
  log('📖 请查看 MIGRATION.md 了解详细变更信息');
  log('🔨 建议运行 "npm run build:binaries" 重新构建所有平台的可执行文件');
}

main();

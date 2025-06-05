#!/usr/bin/env node

/**
 * 发布打包脚本
 * 将构建的可执行文件打包为不同平台的发布版本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { parseConfigFile } = require('./jsonParser');

const BINARIES_DIR = 'binaries';
const RELEASES_DIR = 'releases';
const VERSION = require('../package.json').version;

const PLATFORM_CONFIGS = [
  {
    pattern: /universal-ollama-proxy-win-x64\.exe$/,
    platform: 'windows',
    arch: 'x64',
    packageName: `universal-ollama-proxy-v${VERSION}-windows-x64.zip`,
  },
  {
    pattern: /universal-ollama-proxy-win-arm64\.exe$/,
    platform: 'windows',
    arch: 'arm64',
    packageName: `universal-ollama-proxy-v${VERSION}-windows-arm64.zip`,
  },
  {
    pattern: /universal-ollama-proxy-linux-x64$/,
    platform: 'linux',
    arch: 'x64',
    packageName: `universal-ollama-proxy-v${VERSION}-linux-x64.tar.gz`,
  },
  {
    pattern: /universal-ollama-proxy-linux-arm64$/,
    platform: 'linux',
    arch: 'arm64',
    packageName: `universal-ollama-proxy-v${VERSION}-linux-arm64.tar.gz`,
  },
  {
    pattern: /universal-ollama-proxy-macos-x64$/,
    platform: 'macos',
    arch: 'x64',
    packageName: `universal-ollama-proxy-v${VERSION}-macos-x64.tar.gz`,
  },
  {
    pattern: /universal-ollama-proxy-macos-arm64$/,
    platform: 'macos',
    arch: 'arm64',
    packageName: `universal-ollama-proxy-v${VERSION}-macos-arm64.tar.gz`,
  },
];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyConfigFiles(targetDir) {
  const configDir = 'config';
  const targetConfigDir = path.join(targetDir, 'config');
  const excludeFiles = [];
  const excludePatterns = [/-status\.json$/];

  if (fs.existsSync(configDir)) {
    ensureDir(targetConfigDir);
    const configFiles = fs.readdirSync(configDir);
    configFiles.forEach(file => {
      // 排除状态文件
      const isExcluded = excludeFiles.includes(file) || excludePatterns.some(pattern => pattern.test(file));
      if (isExcluded) {
        return;
      }

      const srcPath = path.join(configDir, file);
      const destPath = path.join(targetConfigDir, file);
      fs.copyFileSync(srcPath, destPath);
      log(`  复制配置文件: ${file}`);
    });
  }

  // 复制 .env.example 文件
  const envExamplePath = '.env.example';
  if (fs.existsSync(envExamplePath)) {
    const targetEnvPath = path.join(targetDir, '.env.example');
    fs.copyFileSync(envExamplePath, targetEnvPath);
    log(`  复制环境配置示例: .env.example`);
  }
}

function createReadme(targetDir, platform, arch, binaryName) {
  // 从配置文件中读取供应商信息
  let providerEnvVars = [];
  let providerDescriptions = [];

  try {
    const unifiedConfigPath = path.join('config', 'unified-providers.json');
    if (fs.existsSync(unifiedConfigPath)) {
      const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf-8');
      const unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);

      if (unifiedConfig && unifiedConfig.providers && Array.isArray(unifiedConfig.providers)) {
        unifiedConfig.providers.forEach(provider => {
          if (provider.apiKey && provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
            const envVarName = provider.apiKey.slice(2, -1);
            providerEnvVars.push({
              name: envVarName,
              displayName: provider.displayName,
            });
          }
        });
      }
    }
  } catch (error) {
    log(`  ⚠️ 无法读取统一配置文件: ${error.message}`);
    // 回退到默认的供应商列表
    providerEnvVars = [
      { name: 'VOLCENGINE_API_KEY', displayName: '火山方舟引擎' },
      { name: 'DASHSCOPE_API_KEY', displayName: '阿里云百炼' },
      { name: 'DEEPSEEK_API_KEY', displayName: 'DeepSeek官方' },
      { name: 'TENCENTDS_API_KEY', displayName: '腾讯云DeepSeek' },
    ];
  }

  // 生成环境变量配置示例
  let envConfigWindows = `# 通用配置\nset PORT=11434\n`;
  let envConfigUnix = `# 通用配置\nexport PORT=11434\n`;

  // 添加供应商API密钥配置
  providerEnvVars.forEach(provider => {
    envConfigWindows += `\n# ${provider.displayName}配置\nset ${provider.name}=your_${provider.name.toLowerCase().replace(/_api_key/i, '')}_api_key_here\n`;
    envConfigUnix += `\n# ${provider.displayName}配置\nexport ${provider.name}=your_${provider.name.toLowerCase().replace(/_api_key/i, '')}_api_key_here\n`;
  });

  const readmeContent = `# Universal Ollama Proxy v${VERSION}

## 平台信息
- **操作系统**: ${platform}
- **架构**: ${arch}
- **版本**: ${VERSION}

## 关于项目
Universal Ollama Proxy 是一个通用的AI服务代理，支持多个主流AI服务提供商：
- 🔥 **火山引擎** (VolcEngine/Doubao)
- ☁️ **阿里云DashScope** (通义千问)
- 🧠 **深度求索** (DeepSeek)
- 🐧 **腾讯云** (TencentDS)
- 🔗 **统一适配器** (支持更多提供商)

## 使用说明

### 1. 配置环境变量
本包包含一个 \`.env.example\` 文件，您可以复制它为 \`.env\` 并修改配置：
${
  platform === 'windows'
    ? `
\`\`\`cmd
copy .env.example .env
\`\`\`

然后编辑 \`.env\` 文件，或者设置系统环境变量：
\`\`\`
${envConfigWindows}
\`\`\`
`
    : `
\`\`\`bash
cp .env.example .env
\`\`\`

然后编辑 \`.env\` 文件，或者设置环境变量：
\`\`\`bash
${envConfigUnix}
\`\`\`
`
}

### 2. 运行程序
${
  platform === 'windows'
    ? `
\`\`\`cmd
${binaryName}
\`\`\`
`
    : `
\`\`\`bash
chmod +x ${binaryName}
./${binaryName}
\`\`\`
`
}

### 3. 测试连接
程序启动后，访问 http://localhost:11434 来测试服务是否正常运行。

## 配置文件
- \`config/\` 目录包含了各个服务提供商的模型配置
- \`.env.example\` 文件包含了环境变量配置示例，复制为 \`.env\` 并根据需要修改
- 可以根据需要修改配置文件来添加或删除模型

## 支持
如有问题，请访问项目主页获取帮助。
`;

  const readmePath = path.join(targetDir, 'README.md');
  fs.writeFileSync(readmePath, readmeContent);
  log(`  创建说明文件: README.md`);
}

function packagePlatform(binaryPath, config) {
  const tempDir = path.join(RELEASES_DIR, 'temp', `${config.platform}-${config.arch}`);
  ensureDir(tempDir);

  // 复制可执行文件
  const binaryName = path.basename(binaryPath);
  const targetBinaryPath = path.join(tempDir, binaryName);
  fs.copyFileSync(binaryPath, targetBinaryPath);
  log(`  复制可执行文件: ${binaryName}`);

  // 复制配置文件
  copyConfigFiles(tempDir);

  // 创建README
  createReadme(tempDir, config.platform, config.arch, binaryName);

  // 创建包
  const packagePath = path.join(RELEASES_DIR, config.packageName);

  try {
    if (config.packageName.endsWith('.zip')) {
      // 使用archiver创建ZIP文件 - 跨平台兼容
      const archiver = require('archiver');
      const output = fs.createWriteStream(packagePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          const stats = fs.statSync(packagePath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          log(`✅ 打包完成: ${config.packageName} (${sizeMB} MB)`);
          resolve(true);
        });

        archive.on('error', err => {
          log(`❌ 打包失败: ${config.packageName} - ${err.message}`);
          reject(false);
        });

        archive.pipe(output);
        archive.directory(tempDir, false);
        archive.finalize();
      });
    } else {
      // Linux/macOS - 使用tar
      const tarCommand = `tar -czf "${packagePath}" -C "${tempDir}" .`;
      execSync(tarCommand, { stdio: 'pipe' });

      const stats = fs.statSync(packagePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`✅ 打包完成: ${config.packageName} (${sizeMB} MB)`);

      return true;
    }
  } catch (error) {
    log(`❌ 打包失败: ${config.packageName} - ${error.message}`);
    return false;
  }
}

async function main() {
  log('开始创建发布包...');

  if (!fs.existsSync(BINARIES_DIR)) {
    log(`❌ 二进制文件目录不存在: ${BINARIES_DIR}`);
    process.exit(1);
  }

  ensureDir(RELEASES_DIR);

  const binaries = fs
    .readdirSync(BINARIES_DIR)
    .filter(file => file.startsWith('universal-ollama-proxy-'))
    .map(file => path.join(BINARIES_DIR, file))
    .filter(file => fs.existsSync(file));

  if (binaries.length === 0) {
    log('❌ 没有找到可执行文件');
    process.exit(1);
  }

  log(`找到 ${binaries.length} 个可执行文件`);

  let successCount = 0;
  for (const binaryPath of binaries) {
    const fileName = path.basename(binaryPath);
    const config = PLATFORM_CONFIGS.find(c => c.pattern.test(fileName));

    if (config) {
      log(`\n📦 打包 ${config.platform} ${config.arch}...`);
      try {
        const result = await packagePlatform(binaryPath, config);
        if (result) {
          successCount++;
        }
      } catch (error) {
        log(`❌ 打包失败: ${config.packageName} - ${error.message}`);
      }
    } else {
      log(`⚠️  跳过未知格式的文件: ${fileName}`);
    }
  }

  // 清理临时目录
  const tempDir = path.join(RELEASES_DIR, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }

  log(`\n🎉 发布包创建完成! ${successCount} 个包已生成在 ${RELEASES_DIR} 目录中`);

  if (fs.existsSync(RELEASES_DIR)) {
    const packages = fs.readdirSync(RELEASES_DIR);
    log('\n📋 生成的发布包:');
    packages.forEach(pkg => {
      const pkgPath = path.join(RELEASES_DIR, pkg);
      const stats = fs.statSync(pkgPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`  - ${pkg} (${sizeMB} MB)`);
    });
  }
}

main();

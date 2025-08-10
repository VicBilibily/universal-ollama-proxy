#!/usr/bin/env node

/**
 * 发布包验证脚本
 * 验证生成的发布包内容是否完整
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseConfigFile } = require('./jsonParser');
const { logger } = require('./utils/logger');

// 使用统一的logger，使用中文本地时间格式
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

const RELEASES_DIR = 'releases';
const REQUIRED_FILES = [
  '.env.example',
  'README.md',
  'config/dashscope-models.json',
  'config/deepseek-models.json',
  'config/tencentds-models.json',
  'config/unified-providers.json',
  'config/volcengine-models.json',
];

function verifyPackage(packagePath) {
  const packageName = path.basename(packagePath);
  log.info(`\n📦 验证发布包: ${packageName}`);

  const tempDir = path.join('temp-verify', packageName.replace(/\.(zip|tar\.gz)$/, ''));

  try {
    // 创建临时目录
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 解压文件
    if (packageName.endsWith('.zip')) {
      // 使用 Node.js 解压 ZIP 文件 - 跨平台兼容
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(packagePath);
      zip.extractAllTo(tempDir, true);
    } else if (packageName.endsWith('.tar.gz')) {
      execSync(`tar -xzf "${packagePath}" -C "${tempDir}"`, { stdio: 'pipe' });
    }

    // 检查必需文件
    let missingFiles = [];
    let foundFiles = [];

    for (const requiredFile of REQUIRED_FILES) {
      const filePath = path.join(tempDir, requiredFile);
      if (fs.existsSync(filePath)) {
        foundFiles.push(requiredFile);
        log.success(`  ✅ ${requiredFile}`);
      } else {
        missingFiles.push(requiredFile);
        log.error(`  ❌ ${requiredFile} (缺失)`);
      }
    }

    // 检查可执行文件
    const files = fs.readdirSync(tempDir);
    const binaryFile = files.find(
      file => file.startsWith('universal-ollama-proxy-') && (file.endsWith('.exe') || !file.includes('.'))
    );

    if (binaryFile) {
      log.success(`  ✅ 可执行文件: ${binaryFile}`);
      foundFiles.push(binaryFile);
    } else {
      log.error(`  ❌ 可执行文件 (缺失)`);
      missingFiles.push('可执行文件');
    }

    // 验证 .env.example 内容
    const envExamplePath = path.join(tempDir, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');

      // 基础必需的环境变量
      let requiredEnvVars = ['PORT'];

      // 从配置文件中读取API密钥环境变量
      try {
        const unifiedConfigPath = path.join(tempDir, 'config', 'unified-providers.json');
        if (fs.existsSync(unifiedConfigPath)) {
          const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf-8');
          const unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);

          // 检查提供商配置中的API密钥配置方式
          let envApiKeys = []; // 需要从环境变量获取的API密钥
          let configProviders = []; // 配置密钥的提供商
          let noAuthProviders = []; // 不需要认证的提供商

          unifiedConfig.providers.forEach(provider => {
            const apiKey = provider.apiKey;
            // 情况1: 需要从环境变量获取的API密钥
            if (apiKey && apiKey.startsWith('${') && apiKey.endsWith('}')) {
              envApiKeys.push(apiKey.slice(2, -1));
            }
            // 情况2: 配置密钥的提供商
            else if (apiKey && apiKey.trim() !== '') {
              configProviders.push(provider.displayName);
            }
            // 情况3: 不需要认证的提供商
            else if (!apiKey || apiKey.trim() === '') {
              noAuthProviders.push(provider.displayName);
            }
          });

          // 将需要从环境变量获取的API密钥添加到必需的环境变量列表中
          requiredEnvVars = [...requiredEnvVars, ...envApiKeys];

          // 记录配置密钥和不需要认证的提供商
          if (configProviders.length > 0) {
            log.info(`    ✅ 配置文件中已配置密钥的提供商: ${configProviders.join(', ')}`);
          }
          if (noAuthProviders.length > 0) {
            log.info(`    ✅ 不需要认证的提供商: ${noAuthProviders.join(', ')}`);
          }
        }
      } catch (error) {
        log.warn(`    ⚠️ 无法读取统一配置文件: ${error.message}`);
        // 回退到硬编码的环境变量列表
        requiredEnvVars = [
          'PORT',
          'VOLCENGINE_API_KEY',
          'DASHSCOPE_API_KEY',
          'DEEPSEEK_API_KEY',
          'TENCENTDS_API_KEY',
          'MOONSHOT_API_KEY',
          'OPENROUTER_API_KEY',
          'MODELSCOPE_API_KEY',
        ];
      }

      for (const envVar of requiredEnvVars) {
        if (envContent.includes(envVar)) {
          log.success(`    ✅ 环境变量: ${envVar}`);
        } else {
          log.error(`    ❌ 环境变量: ${envVar} (缺失)`);
          missingFiles.push(`环境变量 ${envVar}`);
        }
      }
    }

    // 验证 README.md 内容
    const readmePath = path.join(tempDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');
      if (readmeContent.includes('.env.example')) {
        log.success(`    ✅ README 包含 .env.example 说明`);
      } else {
        log.error(`    ❌ README 缺少 .env.example 说明`);
      }
    }

    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true });

    const packageStats = fs.statSync(packagePath);
    const sizeMB = (packageStats.size / 1024 / 1024).toFixed(2);

    if (missingFiles.length === 0) {
      log.success(`  🎉 验证通过! (${sizeMB} MB, ${foundFiles.length} 个文件)`);
      return true;
    } else {
      log.warn(`  ⚠️  发现 ${missingFiles.length} 个问题 (${sizeMB} MB)`);
      return false;
    }
  } catch (error) {
    log.error(`  ❌ 验证失败: ${error.message}`);
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    return false;
  }
}

function main() {
  log.info('开始验证发布包...');

  if (!fs.existsSync(RELEASES_DIR)) {
    log.error(`❌ 发布目录不存在: ${RELEASES_DIR}`);
    process.exit(1);
  }

  const packages = fs
    .readdirSync(RELEASES_DIR)
    .filter(file => file.endsWith('.zip') || file.endsWith('.tar.gz'))
    .map(file => path.join(RELEASES_DIR, file));

  if (packages.length === 0) {
    log.error('❌ 没有找到发布包');
    process.exit(1);
  }

  log.info(`找到 ${packages.length} 个发布包`);

  let successCount = 0;
  for (const packagePath of packages) {
    if (verifyPackage(packagePath)) {
      successCount++;
    }
  }

  // 清理临时目录
  if (fs.existsSync('temp-verify')) {
    fs.rmSync('temp-verify', { recursive: true });
  }

  log.info(`\n📊 验证结果: ${successCount}/${packages.length} 个包通过验证`);

  if (successCount === packages.length) {
    log.success('🎉 所有发布包验证通过!');
    process.exit(0);
  } else {
    log.warn(`⚠️  ${packages.length - successCount} 个包存在问题`);
    process.exit(1);
  }
}

main();

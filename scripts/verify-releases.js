#!/usr/bin/env node

/**
 * 发布包验证脚本
 * 验证生成的发布包内容是否完整
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function verifyPackage(packagePath) {
  const packageName = path.basename(packagePath);
  log(`\n📦 验证发布包: ${packageName}`);

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
        log(`  ✅ ${requiredFile}`);
      } else {
        missingFiles.push(requiredFile);
        log(`  ❌ ${requiredFile} (缺失)`);
      }
    }

    // 检查可执行文件
    const files = fs.readdirSync(tempDir);
    const binaryFile = files.find(
      file => file.startsWith('universal-ollama-proxy-') && (file.endsWith('.exe') || !file.includes('.'))
    );

    if (binaryFile) {
      log(`  ✅ 可执行文件: ${binaryFile}`);
      foundFiles.push(binaryFile);
    } else {
      log(`  ❌ 可执行文件 (缺失)`);
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
          const unifiedConfig = JSON.parse(unifiedConfigContent);

          // 从配置中提取所有API KEY环境变量
          const apiKeys = unifiedConfig.providers
            .map(provider => {
              const apiKey = provider.apiKey;
              if (apiKey && apiKey.startsWith('${') && apiKey.endsWith('}')) {
                return apiKey.slice(2, -1);
              }
              return null;
            })
            .filter(key => key !== null);

          // 将API密钥添加到必需的环境变量列表中
          requiredEnvVars = [...requiredEnvVars, ...apiKeys];
        }
      } catch (error) {
        log(`    ⚠️ 无法读取统一配置文件: ${error.message}`);
        // 回退到硬编码的环境变量列表
        requiredEnvVars = ['PORT', 'VOLCENGINE_API_KEY', 'DASHSCOPE_API_KEY', 'DEEPSEEK_API_KEY', 'TENCENTDS_API_KEY'];
      }

      for (const envVar of requiredEnvVars) {
        if (envContent.includes(envVar)) {
          log(`    ✅ 环境变量: ${envVar}`);
        } else {
          log(`    ❌ 环境变量: ${envVar} (缺失)`);
          missingFiles.push(`环境变量 ${envVar}`);
        }
      }
    }

    // 验证 README.md 内容
    const readmePath = path.join(tempDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');
      if (readmeContent.includes('.env.example')) {
        log(`    ✅ README 包含 .env.example 说明`);
      } else {
        log(`    ❌ README 缺少 .env.example 说明`);
      }
    }

    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true });

    const packageStats = fs.statSync(packagePath);
    const sizeMB = (packageStats.size / 1024 / 1024).toFixed(2);

    if (missingFiles.length === 0) {
      log(`  🎉 验证通过! (${sizeMB} MB, ${foundFiles.length} 个文件)`);
      return true;
    } else {
      log(`  ⚠️  发现 ${missingFiles.length} 个问题 (${sizeMB} MB)`);
      return false;
    }
  } catch (error) {
    log(`  ❌ 验证失败: ${error.message}`);
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    return false;
  }
}

function main() {
  log('开始验证发布包...');

  if (!fs.existsSync(RELEASES_DIR)) {
    log(`❌ 发布目录不存在: ${RELEASES_DIR}`);
    process.exit(1);
  }

  const packages = fs
    .readdirSync(RELEASES_DIR)
    .filter(file => file.endsWith('.zip') || file.endsWith('.tar.gz'))
    .map(file => path.join(RELEASES_DIR, file));

  if (packages.length === 0) {
    log('❌ 没有找到发布包');
    process.exit(1);
  }

  log(`找到 ${packages.length} 个发布包`);

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

  log(`\n📊 验证结果: ${successCount}/${packages.length} 个包通过验证`);

  if (successCount === packages.length) {
    log('🎉 所有发布包验证通过!');
    process.exit(0);
  } else {
    log(`⚠️  ${packages.length - successCount} 个包存在问题`);
    process.exit(1);
  }
}

main();

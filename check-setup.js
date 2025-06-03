#!/usr/bin/env node

/**
 * 服务器启动前配置检查脚本
 */

const fs = require('fs');
const path = require('path');

function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    logger.error('❌ 缺少 .env 文件');
    logger.info('💡 请复制 .env.example 到 .env 并填入正确的配置');
    logger.info('   cp .env.example .env');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  // 检查环境变量（至少需要一个）
  const apiKeys = ['VOLCENGINE_API_KEY', 'DASHSCOPE_API_KEY'];
  const validKeys = [];
  const missingKeys = [];

  for (const varName of apiKeys) {
    const match = envContent.match(new RegExp(`${varName}=(.+)`));
    if (match && match[1].trim() !== '' && !match[1].includes('your_')) {
      validKeys.push(varName);
    } else {
      missingKeys.push(varName);
    }
  }

  if (validKeys.length === 0) {
    logger.error('❌ 至少需要配置一个有效的 API Key:');
    missingKeys.forEach(varName => {
      logger.info(`   - ${varName}`);
    });
    logger.info('💡 请在 .env 文件中设置正确的 API Key');
    logger.info('💡 VOLCENGINE_API_KEY: 火山方舟引擎 API Key');
    logger.info('💡 DASHSCOPE_API_KEY: 阿里云百炼 API Key');
    logger.info('💡 目前这些变量设置为示例值，需要替换为真实的 API Key');
    return false;
  }

  logger.success('✅ 环境变量配置检查通过');
  if (validKeys.length < apiKeys.length) {
    logger.info('💡 已配置的 API Key:', validKeys.join(', '));
    logger.info('💡 未配置的 API Key:', missingKeys.join(', '));
    logger.info('💡 提示：配置更多 API Key 可以享受多服务商支持和自动切换');
  }
  return true;
}

/**
 * 统一的日志工具
 */
const logger = {
  info: message => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[34m[INFO]\x1b[0m ${message}`);
  },
  success: message => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[32m[SUCCESS]\x1b[0m ${message}`);
  },
  error: message => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.error(`\x1b[90m${timestamp}\x1b[0m \x1b[31m[ERROR]\x1b[0m ${message}`);
  },
  warn: message => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.warn(`\x1b[90m${timestamp}\x1b[0m \x1b[33m[WARN]\x1b[0m ${message}`);
  },
};

function checkDependencies() {
  const packagePath = path.join(__dirname, 'package.json');
  const nodeModulesPath = path.join(__dirname, 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    logger.error('❌ 缺少依赖包');
    logger.info('💡 请运行: npm install');
    return false;
  }

  logger.success('✅ 依赖包检查通过');
  return true;
}

function checkBuild() {
  const distPath = path.join(__dirname, 'dist');

  if (!fs.existsSync(distPath)) {
    logger.warn('⚠️  缺少构建文件');
    logger.info('💡 请运行: npm run build');
    return false;
  }

  logger.success('✅ 构建文件检查通过');
  return true;
}

function main() {
  logger.info('🔍 开始启动前检查...\n');

  const checks = [
    { name: '依赖包', fn: checkDependencies },
    { name: '环境配置', fn: checkEnvFile },
    { name: '构建文件', fn: checkBuild },
  ];

  let allPassed = true;

  for (const check of checks) {
    if (!check.fn()) {
      allPassed = false;
    }
  }

  console.log('');

  if (allPassed) {
    logger.success('🎉 所有检查通过！可以启动服务器了');
    logger.info('💡 运行命令:');
    logger.info('   - 开发模式: npm run dev');
    logger.info('   - 生产模式: npm start');
    process.exit(0);
  } else {
    logger.error('❌ 检查失败，请根据上述提示修复问题');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvFile, checkDependencies, checkBuild };

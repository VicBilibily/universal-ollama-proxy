#!/usr/bin/env node

/**
 * 服务器启动前配置检查脚本
 */

const fs = require('fs');
const path = require('path');

function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');

  // 在 CI 环境中跳过环境检查
  if (process.env.CI === 'true') {
    logger.info('🔄 CI 环境中，跳过 .env 文件检查');
    return true;
  }

  if (!fs.existsSync(envPath)) {
    logger.error('❌ 缺少 .env 文件');
    logger.info('💡 请复制 .env.example 到 .env 并填入正确的配置');
    logger.info('   cp .env.example .env');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  // 从统一配置文件中读取所有API密钥环境变量
  let apiKeys = [];
  try {
    const unifiedConfigPath = path.join(__dirname, 'config', 'unified-providers.json');
    const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf8');
    const unifiedConfig = JSON.parse(unifiedConfigContent);

    apiKeys = unifiedConfig.providers
      .map(provider => {
        // 从配置中提取环境变量名，例如将"${DEEPSEEK_API_KEY}"转换为"DEEPSEEK_API_KEY"
        const apiKey = provider.apiKey;
        if (apiKey.startsWith('${') && apiKey.endsWith('}')) {
          return apiKey.slice(2, -1);
        }
        return null;
      })
      .filter(key => key !== null);
  } catch (error) {
    logger.error(`❌ 无法读取统一配置文件: ${error.message}`);
    logger.warn('⚠️ 使用默认API Key检查列表');
  }

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
    logger.info('💡 请在 .env 文件中设置至少一个正确的 API Key');
    // 显示所有可能的API Key提示
    try {
      const unifiedConfigPath = path.join(__dirname, 'config', 'unified-providers.json');
      const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf8');
      const unifiedConfig = JSON.parse(unifiedConfigContent);

      unifiedConfig.providers.forEach(provider => {
        const envVar = provider.apiKey.slice(2, -1);
        logger.info(`💡 ${envVar}: ${provider.displayName} API Key`);
      });
    } catch (error) {
      // 如果无法读取配置文件，则提供通用提示
      logger.info('💡 请在 .env 文件中设置至少一个 API Key');
      logger.info('💡 您可以查看配置文件 config/unified-providers.json 了解支持的 API Key');
    }
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

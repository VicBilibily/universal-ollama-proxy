#!/usr/bin/env node

/**
 * 服务器启动前配置检查脚本
 */

const fs = require('fs');
const path = require('path');
const { parseConfigFile } = require('./jsonParser');
const { logger } = require('./utils/logger');

// 使用统一的logger，使用中文本地时间格式
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');

  // 在 CI 环境中跳过环境检查
  if (process.env.CI === 'true') {
    log.info('🔄 CI 环境中，跳过 .env 文件检查');
    return true;
  }

  if (!fs.existsSync(envPath)) {
    log.error('❌ 缺少 .env 文件');
    log.info('💡 请复制 .env.example 到 .env 并填入正确的配置');
    log.info('   cp .env.example .env');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  // 从统一配置文件中读取所有API密钥环境变量
  let apiKeys = [];
  try {
    const unifiedConfigPath = path.join(__dirname, '..', 'config', 'unified-providers.json');
    const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf8');
    const unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);

    // 收集需要从环境变量中获取的API Keys
    apiKeys = unifiedConfig.providers
      .map(provider => {
        // 从配置中提取环境变量名，例如将"${DEEPSEEK_API_KEY}"转换为"DEEPSEEK_API_KEY"
        const apiKey = provider.apiKey;
        // 只检查以${开头的配置项，其他情况（配置中已包含key或不需要认证）无需从环境变量获取
        if (apiKey && apiKey.startsWith('${') && apiKey.endsWith('}')) {
          return apiKey.slice(2, -1);
        }
        return null;
      })
      .filter(key => key !== null);
  } catch (error) {
    log.error(`❌ 无法读取统一配置文件: ${error.message}`);
    log.warn('⚠️ 使用默认API Key检查列表');
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

  // 检查配置文件中是否有配置密钥或无需认证的服务商
  let hasConfigKeys = false;
  try {
    const unifiedConfigPath = path.join(__dirname, '..', 'config', 'unified-providers.json');
    const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf8');
    const unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);

    const configProviders = unifiedConfig.providers.filter(provider => {
      // 配置文件中已包含 key 或不需要认证的情况
      return (
        (provider.apiKey && !provider.apiKey.startsWith('${')) || !provider.apiKey || provider.apiKey.trim() === ''
      );
    });

    if (configProviders.length > 0) {
      hasConfigKeys = true;
      log.info('💡 发现配置文件中已包含的服务商:');
      configProviders.forEach(provider => {
        if (!provider.apiKey || provider.apiKey.trim() === '') {
          log.info(`   - ${provider.displayName} (无需认证)`);
        } else {
          log.info(`   - ${provider.displayName} (配置密钥)`);
        }
      });
    }
  } catch (error) {
    // 配置文件读取失败，忽略
  }

  // 如果没有可用的API Key(环境变量中没有，配置文件中也没有配置的)
  if (validKeys.length === 0 && !hasConfigKeys) {
    log.error('❌ 至少需要配置一个有效的 API Key:');
    missingKeys.forEach(varName => {
      log.info(`   - ${varName}`);
    });
    log.info('💡 请在 .env 文件中设置至少一个正确的 API Key，或在配置文件中配置密钥');
    // 显示所有可能的API Key提示
    try {
      const unifiedConfigPath = path.join(__dirname, '..', 'config', 'unified-providers.json');
      const unifiedConfigContent = fs.readFileSync(unifiedConfigPath, 'utf8');
      const unifiedConfig = parseConfigFile(unifiedConfigContent, unifiedConfigPath);

      unifiedConfig.providers.forEach(provider => {
        // 只处理需要从环境变量获取的API Key
        if (provider.apiKey && provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
          const envVar = provider.apiKey.slice(2, -1);
          log.info(`💡 ${envVar}: ${provider.displayName} API Key`);
        }
      });
    } catch (error) {
      // 如果无法读取配置文件，则提供通用提示
      log.info('💡 请在 .env 文件中设置至少一个 API Key');
      log.info('💡 您可以查看配置文件 config/unified-providers.json 了解支持的 API Key');
    }
    log.info('💡 目前这些变量设置为示例值，需要替换为真实的 API Key');
    return false;
  }

  log.success('✅ 环境变量配置检查通过');

  // 如果有API Key需要从环境变量获取，显示详情
  if (apiKeys.length > 0) {
    if (validKeys.length < apiKeys.length) {
      log.info('💡 已配置的环境变量 API Key:', validKeys.join(', '));
      log.info('💡 未配置的环境变量 API Key:', missingKeys.join(', '));
      log.info('💡 提示：配置更多 API Key 可以享受多服务商支持和自动切换');
    } else {
      log.info('💡 所有需要的环境变量 API Key 均已配置');
    }
  }
  return true;
}

/**
 * 统一的日志工具
 */

function checkDependencies() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    log.error('❌ 缺少依赖包');
    log.info('💡 请运行: npm install');
    return false;
  }

  log.success('✅ 依赖包检查通过');
  return true;
}

function checkBuild() {
  const distPath = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distPath)) {
    log.warn('⚠️  缺少构建文件');
    log.info('💡 请运行: npm run build');
    return false;
  }

  log.success('✅ 构建文件检查通过');
  return true;
}

function main() {
  log.info('🔍 开始启动前检查...\n');

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
    log.success('🎉 所有检查通过！可以启动服务器了');
    log.info('💡 运行命令:');
    log.info('   - 开发模式: npm run dev');
    log.info('   - 生产模式: npm start');
    process.exit(0);
  } else {
    log.error('❌ 检查失败，请根据上述提示修复问题');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvFile, checkDependencies, checkBuild };

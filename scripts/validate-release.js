#!/usr/bin/env node

/**
 * 发布流程验证脚本
 * 模拟完整的发布流程，用于本地测试
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');

// 配置日志使用中文本地时间格式
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

/**
 * 运行命令并返回结果
 */
function runCommand(command, description) {
  log.info(`开始: ${description}`);
  try {
    const startTime = Date.now();
    const result = execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
    const duration = Date.now() - startTime;
    log.success(`完成: ${description} (${duration}ms)`);
    return { success: true, output: result, duration };
  } catch (error) {
    log.error(`失败: ${description} - ${error.message}`);
    return { success: false, error: error.message, duration: 0 };
  }
}

/**
 * 检查文件是否存在
 */
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    logger.success(`${description}: ${filePath} (${sizeMB} MB)`);
    return true;
  } else {
    logger.error(`${description}: ${filePath} (文件不存在)`);
    return false;
  }
}

/**
 * 验证发布流程
 */
async function validateReleaseProcess() {
  logger.info('🚀 开始发布流程验证...');
  logger.info('='.repeat(60));

  const steps = [
    {
      name: '环境检查',
      command: 'npm run check',
      required: true,
      description: '检查项目环境和依赖',
    },
    {
      name: '代码检查',
      command: 'npm run lint',
      required: true,
      description: '运行代码格式检查',
    },
    {
      name: 'TypeScript 编译',
      command: 'npm run build',
      required: true,
      description: '编译 TypeScript 代码',
    },
    {
      name: '构建二进制文件',
      command: 'npm run build:binaries',
      required: true,
      description: '构建所有平台的二进制文件',
    },
    {
      name: '验证二进制文件',
      command: 'npm run verify:binaries',
      required: true,
      description: '验证生成的二进制文件',
    },
    {
      name: '创建发布包',
      command: 'npm run create:release',
      required: true,
      description: '创建发布包',
    },
    {
      name: '验证发布包',
      command: 'npm run verify:releases',
      required: true,
      description: '验证发布包完整性',
    },
  ];

  let successCount = 0;
  let totalDuration = 0;
  const results = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    logger.info(`\\n[${i + 1}/${steps.length}] ${step.name}`);
    logger.info('-'.repeat(40));

    const result = runCommand(step.command, step.description);
    results.push({
      ...step,
      ...result,
    });

    totalDuration += result.duration;

    if (result.success) {
      successCount++;
    } else if (step.required) {
      logger.error(`必需步骤失败: ${step.name}`);
      logger.error('发布流程验证失败');
      return false;
    }
  }

  // 验证生成的文件
  logger.info('\\n📦 验证生成的文件...');
  logger.info('-'.repeat(40));

  const expectedBinaries = [
    'binaries/universal-ollama-proxy-win-x64.exe',
    'binaries/universal-ollama-proxy-win-arm64.exe',
    'binaries/universal-ollama-proxy-linux-x64',
    'binaries/universal-ollama-proxy-linux-arm64',
    'binaries/universal-ollama-proxy-macos-x64',
    'binaries/universal-ollama-proxy-macos-arm64',
  ];

  const expectedReleases = [
    'universal-ollama-proxy-v1.0.1-windows-x64.zip',
    'universal-ollama-proxy-v1.0.1-windows-arm64.zip',
    'universal-ollama-proxy-v1.0.1-linux-x64.tar.gz',
    'universal-ollama-proxy-v1.0.1-linux-arm64.tar.gz',
    'universal-ollama-proxy-v1.0.1-macos-x64.tar.gz',
    'universal-ollama-proxy-v1.0.1-macos-arm64.tar.gz',
  ];

  let fileChecksPassed = 0;

  // 检查二进制文件
  expectedBinaries.forEach(binary => {
    if (checkFile(binary, '二进制文件')) {
      fileChecksPassed++;
    }
  });

  // 检查发布包
  expectedReleases.forEach(release => {
    const releasePath = path.join('releases', release);
    if (checkFile(releasePath, '发布包')) {
      fileChecksPassed++;
    }
  });

  // 生成报告
  logger.info('\\n📊 验证报告');
  logger.info('='.repeat(60));
  logger.info(`步骤完成: ${successCount}/${steps.length}`);
  logger.info(`文件验证: ${fileChecksPassed}/${expectedBinaries.length + expectedReleases.length}`);
  logger.info(`总耗时: ${(totalDuration / 1000).toFixed(2)} 秒`);

  // 保存详细报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      stepsCompleted: successCount,
      totalSteps: steps.length,
      filesVerified: fileChecksPassed,
      totalFiles: expectedBinaries.length + expectedReleases.length,
      totalDuration: totalDuration,
      success: successCount === steps.length && fileChecksPassed === expectedBinaries.length + expectedReleases.length,
    },
    steps: results,
    files: {
      binaries: expectedBinaries.map(binary => ({
        path: binary,
        exists: fs.existsSync(binary),
        size: fs.existsSync(binary) ? fs.statSync(binary).size : 0,
      })),
      releases: expectedReleases.map(release => {
        const releasePath = path.join('releases', release);
        return {
          path: releasePath,
          exists: fs.existsSync(releasePath),
          size: fs.existsSync(releasePath) ? fs.statSync(releasePath).size : 0,
        };
      }),
    },
  };

  // 创建日志状态目录（如果不存在）
  const logsDir = path.join(__dirname, '..', 'logs', 'status');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // 保存到状态目录
  const reportPath = path.join(logsDir, 'release-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logger.success(`详细报告已保存: ${path.relative(process.cwd(), reportPath)}`);

  if (report.summary.success) {
    logger.success('\\n🎉 发布流程验证成功！');
    logger.info('💡 可以使用 GitHub Actions 进行自动发布了');
    return true;
  } else {
    logger.error('\\n❌ 发布流程验证失败');
    logger.info('💡 请检查失败的步骤并修复问题');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.clear();
  logger.info('🔍 Universal Ollama Proxy - 发布流程验证');
  logger.info('='.repeat(60));

  try {
    const success = await validateReleaseProcess();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logger.error(`验证过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行脚本
if (require.main === module) {
  main();
}

module.exports = { validateReleaseProcess };

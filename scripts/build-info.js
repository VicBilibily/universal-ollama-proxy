#!/usr/bin/env node

/**
 * 构建信息显示脚本
 * 显示当前构建状态和生成的文件信息
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');

// 使用统一的logger系统
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

const BINARIES_DIR = 'binaries';
const RELEASES_DIR = 'releases';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileInfo(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    modified: stats.mtime,
    sizeFormatted: formatSize(stats.size),
  };
}

function displayBinaries() {
  log.info('📦 二进制文件状态:');
  log.info('=' + '='.repeat(50));

  if (!fs.existsSync(BINARIES_DIR)) {
    log.error('❌ 二进制文件目录不存在');
    return;
  }

  const files = fs.readdirSync(BINARIES_DIR);
  const binaries = files.filter(file => file.startsWith('universal-ollama-proxy-') || file.endsWith('.exe'));

  if (binaries.length === 0) {
    log.error('❌ 没有找到二进制文件');
    return;
  }

  binaries.sort().forEach(binary => {
    const binaryPath = path.join(BINARIES_DIR, binary);
    const info = getFileInfo(binaryPath);

    if (info) {
      const platform = binary.includes('win')
        ? '🪟 Windows'
        : binary.includes('linux')
          ? '🐧 Linux'
          : binary.includes('macos')
            ? '🍎 macOS'
            : '❓ Unknown';

      const arch = binary.includes('arm64') ? 'ARM64' : binary.includes('x64') ? 'x64' : 'Unknown';

      log.info(`  ${platform} ${arch.padEnd(6)} | ${info.sizeFormatted.padEnd(10)} | ${binary}`);
    }
  });

  log.info('');
}

function displayReleases() {
  log.info('📋 发布包状态:');
  log.info('=' + '='.repeat(50));

  if (!fs.existsSync(RELEASES_DIR)) {
    log.error('❌ 发布包目录不存在');
    return;
  }

  const files = fs.readdirSync(RELEASES_DIR);
  const releases = files.filter(file => file.endsWith('.zip') || file.endsWith('.tar.gz'));

  if (releases.length === 0) {
    log.error('❌ 没有找到发布包');
    return;
  }

  releases.sort().forEach(release => {
    const releasePath = path.join(RELEASES_DIR, release);
    const info = getFileInfo(releasePath);

    if (info) {
      const platform = release.includes('windows')
        ? '🪟 Windows'
        : release.includes('linux')
          ? '🐧 Linux'
          : release.includes('macos')
            ? '🍎 macOS'
            : '❓ Unknown';

      const arch = release.includes('arm64') ? 'ARM64' : release.includes('x64') ? 'x64' : 'Unknown';

      log.info(`  ${platform} ${arch.padEnd(6)} | ${info.sizeFormatted.padEnd(10)} | ${release}`);
    }
  });

  log.info('');
}

function displayCommands() {
  log.info('🛠️  可用命令:');
  log.info('=' + '='.repeat(50));
  log.info('  npm run build:binaries    - 构建所有平台二进制文件');
  log.info('  npm run verify:binaries   - 验证二进制文件');
  log.info('  npm run create:release    - 创建发布包');
  log.info('  npm run release          - 完整发布流程');
  log.info('  node scripts/quick-build.js      - 交互式快速构建');
  log.info('  node scripts/build-binaries.js windows  - 仅构建 Windows');
  log.info('  node scripts/build-binaries.js linux    - 仅构建 Linux');
  log.info('  node scripts/build-binaries.js macos    - 仅构建 macOS');
  log.info('');
}

function displayStats() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  log.info('ℹ️  项目信息:');
  log.info('=' + '='.repeat(50));
  log.info(`  项目名称: ${packageJson.name}`);
  log.info(`  版本: ${packageJson.version}`);
  log.info(`  描述: ${packageJson.description}`);
  log.info('');
}

function main() {
  console.clear();
  log.info('🚀 Universal Ollama Proxy - 构建状态');
  log.info('=' + '='.repeat(52));
  log.info('');

  displayStats();
  displayBinaries();
  displayReleases();
  displayCommands();

  log.info('提示: 运行 node scripts/quick-build.js 启动交互式构建工具');
}

main();

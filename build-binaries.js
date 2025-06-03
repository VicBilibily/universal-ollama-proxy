#!/usr/bin/env node

/**
 * 多平台可执行文件构建脚本
 * 支持 Windows、Linux、macOS 的 x64 和 arm64 架构
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLATFORMS = [
  { name: 'Windows x64', target: 'node18-win-x64', output: 'universal-ollama-proxy-win-x64.exe' },
  { name: 'Windows ARM64', target: 'node18-win-arm64', output: 'universal-ollama-proxy-win-arm64.exe' },
  { name: 'Linux x64', target: 'node18-linux-x64', output: 'universal-ollama-proxy-linux-x64' },
  { name: 'Linux ARM64', target: 'node18-linux-arm64', output: 'universal-ollama-proxy-linux-arm64' },
  { name: 'macOS x64', target: 'node18-macos-x64', output: 'universal-ollama-proxy-macos-x64' },
  { name: 'macOS ARM64', target: 'node18-macos-arm64', output: 'universal-ollama-proxy-macos-arm64' },
];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runCommand(command, description) {
  log(`开始: ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`完成: ${description}`);
    return true;
  } catch (error) {
    log(`失败: ${description}`);
    console.error(error.message);
    return false; // 不退出，返回失败
  }
}

function main() {
  const args = process.argv.slice(2);
  const buildAll = args.includes('--all') || args.length === 0;
  const selectedPlatforms = args.filter(arg => !arg.startsWith('--'));

  log('开始构建多平台可执行文件...');

  // 确保 TypeScript 代码已编译
  if (!fs.existsSync('dist/index.js')) {
    log('TypeScript 代码未编译，开始编译...');
    runCommand('npm run build', 'TypeScript 编译');
  }

  // 创建输出目录
  const outputDir = 'binaries';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 构建平台列表
  let platformsToBuild = PLATFORMS;
  if (!buildAll && selectedPlatforms.length > 0) {
    platformsToBuild = PLATFORMS.filter(platform =>
      selectedPlatforms.some(selected => platform.name.toLowerCase().includes(selected.toLowerCase()))
    );
  }

  if (platformsToBuild.length === 0) {
    log('错误: 没有找到匹配的平台');
    log('可用平台: windows, linux, macos');
    process.exit(1);
  }

  log(`将构建 ${platformsToBuild.length} 个平台的可执行文件:`);
  platformsToBuild.forEach(platform => log(`  - ${platform.name}`)); // 构建各平台可执行文件
  for (const platform of platformsToBuild) {
    const outputPath = path.join(outputDir, platform.output);
    const command = `npx pkg dist/index.js --targets ${platform.target} --output "${outputPath}"`;

    const success = runCommand(command, `构建 ${platform.name}`);

    if (success && fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`✓ ${platform.name} 构建成功 (${sizeMB} MB): ${outputPath}`);
    } else {
      log(`✗ ${platform.name} 构建失败`);
    }
  }

  log('所有平台构建完成!');
  log(`输出目录: ${path.resolve(outputDir)}`);
}

// 帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
多平台可执行文件构建脚本

用法:
  node build-binaries.js [选项] [平台...]

选项:
  --all           构建所有平台 (默认)
  --help, -h      显示帮助信息

平台:
  windows         构建 Windows 平台
  linux           构建 Linux 平台
  macos           构建 macOS 平台

示例:
  node build-binaries.js                    # 构建所有平台
  node build-binaries.js --all              # 构建所有平台
  node build-binaries.js windows            # 只构建 Windows 平台
  node build-binaries.js linux macos        # 构建 Linux 和 macOS 平台
`);
  process.exit(0);
}

main();

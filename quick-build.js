#!/usr/bin/env node

/**
 * 快速构建脚本
 * 提供简单的交互式界面来构建特定平台
 */

const { execSync } = require('child_process');
const readline = require('readline');

const QUICK_OPTIONS = [
  { name: '构建所有平台', command: 'npm run build:binaries' },
  { name: '仅构建 Windows 平台', command: 'node build-binaries.js windows' },
  { name: '仅构建 Linux 平台', command: 'node build-binaries.js linux' },
  { name: '仅构建 macOS 平台', command: 'node build-binaries.js macos' },
  { name: '创建发布包', command: 'npm run create:release' },
  { name: '完整发布流程 (构建+验证+打包)', command: 'npm run release' },
  { name: '验证已有二进制文件', command: 'npm run verify:binaries' },
];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function displayMenu() {
  console.log('\n🚀 Universal Ollama Proxy - 快速构建工具\n');
  console.log('请选择要执行的操作:');
  QUICK_OPTIONS.forEach((option, index) => {
    console.log(`  ${index + 1}. ${option.name}`);
  });
  console.log('  0. 退出\n');
}

function runCommand(command) {
  log(`执行命令: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log('✅ 命令执行成功');
  } catch (error) {
    log(`❌ 命令执行失败: ${error.message}`);
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    displayMenu();

    const answer = await new Promise(resolve => {
      rl.question('请输入选项编号: ', resolve);
    });

    const choice = parseInt(answer);

    if (choice === 0) {
      console.log('\n👋 再见！');
      break;
    }

    if (choice >= 1 && choice <= QUICK_OPTIONS.length) {
      const selectedOption = QUICK_OPTIONS[choice - 1];
      console.log(`\n执行: ${selectedOption.name}`);
      runCommand(selectedOption.command);

      console.log('\n按回车键继续...');
      await new Promise(resolve => {
        rl.question('', resolve);
      });
    } else {
      console.log('\n❌ 无效的选项，请重新选择');
    }
  }

  rl.close();
}

// 如果直接运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { QUICK_OPTIONS, runCommand };

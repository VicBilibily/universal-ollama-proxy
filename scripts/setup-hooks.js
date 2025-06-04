#!/usr/bin/env node

/**
 * Git Hooks 设置脚本
 * 在首次安装后初始化 Git Hooks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 日志输出函数
 * @param {string} message 输出消息
 * @param {'info'|'success'|'warn'|'error'} type 消息类型
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const colors = {
    info: '\x1b[36m', // 青色
    success: '\x1b[32m', // 绿色
    warn: '\x1b[33m', // 黄色
    error: '\x1b[31m', // 红色
  };

  const prefix = {
    info: '[INFO]',
    success: '[成功]',
    warn: '[警告]',
    error: '[错误]',
  };

  const color = colors[type] || colors.info;
  const resetColor = '\x1b[0m';
  const prefixText = prefix[type] || prefix.info;

  console.log(`\x1b[90m${timestamp}\x1b[0m ${color}${prefixText}${resetColor} ${message}`);
}

/**
 * 运行命令
 * @param {string} command 命令
 * @param {string} description 描述
 * @returns {boolean} 是否成功
 */
function runCommand(command, description) {
  log(`${description}...`, 'info');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`${description} - 成功`, 'success');
    return true;
  } catch (error) {
    log(`${description} - 失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 创建 Husky 钩子文件
 * @param {string} hookName 钩子名称
 * @param {string} content 文件内容
 */
function createHuskyHook(hookName, content) {
  const huskyDir = path.join(__dirname, '..', '.husky');
  const hookFile = path.join(huskyDir, hookName);

  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true });
    log(`创建 .husky 目录`, 'info');
  }

  fs.writeFileSync(hookFile, content, { mode: 0o755 });
  log(`创建 ${hookName} 钩子`, 'success');
}

/**
 * 检查是否为 Git 仓库
 * @returns {boolean} 是否为 Git 仓库
 */
function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  log('开始设置 Git Hooks...', 'info');

  // 检查是否为 Git 仓库
  if (!isGitRepo()) {
    log('当前目录不是 Git 仓库，跳过设置 Git Hooks', 'warn');
    return;
  }

  // 初始化 Husky
  if (runCommand('npx husky init', '初始化 Husky')) {
    // 创建 pre-commit 钩子
    const preCommitContent = `. "$(dirname -- "$0")/_/husky.sh"

# 使用 lint-staged 只格式化暂存的文件
npx lint-staged
`;
    createHuskyHook('pre-commit', preCommitContent);

    log('Git Hooks 设置完成！现在每次提交前代码将自动格式化。', 'success');
  } else {
    log('Git Hooks 设置失败，请手动运行 "npx husky install" 并设置钩子', 'error');
  }
}

// 执行主函数
main();

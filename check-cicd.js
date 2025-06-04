#!/usr/bin/env node

/**
 * CI/CD 状态检查脚本
 * 检查 GitHub Actions 工作流配置和状态
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKFLOWS_DIR = '.github/workflows';
const REQUIRED_WORKFLOWS = ['ci.yml', 'release.yml'];

const WORKFLOW_CONFIGS = {
  'ci.yml': {
    name: '持续集成 (CI)',
    description: '代码质量检查和跨平台测试',
    triggers: ['push', 'pull_request'],
  },
  'release.yml': {
    name: '发布构建 (Release)',
    description: '自动构建和发布程序包',
    triggers: ['release'],
  },
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[34m',
    success: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };

  const color = colors[type] || colors.info;
  console.log(`\x1b[90m${timestamp}\x1b[0m ${color}[${type.toUpperCase()}]\x1b[0m ${message}`);
}

function checkWorkflowFiles() {
  log('检查工作流文件...');

  if (!fs.existsSync(WORKFLOWS_DIR)) {
    log(`工作流目录不存在: ${WORKFLOWS_DIR}`, 'error');
    return false;
  }

  let allExists = true;

  for (const workflow of REQUIRED_WORKFLOWS) {
    const workflowPath = path.join(WORKFLOWS_DIR, workflow);
    const config = WORKFLOW_CONFIGS[workflow];

    if (fs.existsSync(workflowPath)) {
      log(`✅ ${config.name} (${workflow})`, 'success');
      log(`   描述: ${config.description}`);
      log(`   触发: ${config.triggers.join(', ')}`);
    } else {
      log(`❌ ${config.name} (${workflow}) - 文件不存在`, 'error');
      allExists = false;
    }
  }

  return allExists;
}

function checkPackageScripts() {
  log('\n检查 package.json 脚本...');

  const packagePath = 'package.json';
  if (!fs.existsSync(packagePath)) {
    log('package.json 不存在', 'error');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};

  const requiredScripts = ['build', 'lint', 'build:binaries', 'verify:binaries', 'create:release', 'release'];

  let allScriptsExist = true;

  for (const script of requiredScripts) {
    if (scripts[script]) {
      log(`✅ ${script}: ${scripts[script]}`, 'success');
    } else {
      log(`❌ ${script} - 脚本不存在`, 'error');
      allScriptsExist = false;
    }
  }

  return allScriptsExist;
}

function checkBuildScripts() {
  log('\n检查构建脚本...');

  const buildScripts = ['build-binaries.js', 'create-release.js', 'verify-binaries.js', 'verify-releases.js'];

  let allScriptsExist = true;

  for (const script of buildScripts) {
    if (fs.existsSync(script)) {
      const stats = fs.statSync(script);
      log(`✅ ${script} (${(stats.size / 1024).toFixed(1)} KB)`, 'success');
    } else {
      log(`❌ ${script} - 文件不存在`, 'error');
      allScriptsExist = false;
    }
  }

  return allScriptsExist;
}

function checkGitStatus() {
  log('\n检查 Git 状态...');

  try {
    // 检查是否在 Git 仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });

    // 检查远程仓库
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    if (remotes.includes('github.com')) {
      log('✅ 检测到 GitHub 远程仓库', 'success');
    } else {
      log('⚠️  未检测到 GitHub 远程仓库', 'warn');
    }

    // 检查当前分支
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log(`✅ 当前分支: ${branch}`, 'success');

    return true;
  } catch (error) {
    log('❌ 不在 Git 仓库中或 Git 配置有问题', 'error');
    return false;
  }
}

function checkDirectories() {
  log('\n检查目录结构...');

  const directories = [
    { path: 'src', description: '源代码目录' },
    { path: 'config', description: '配置文件目录' },
    { path: 'dist', description: '构建输出目录', optional: true },
    { path: 'binaries', description: '二进制文件目录', optional: true },
    { path: 'releases', description: '发布包目录', optional: true },
  ];

  for (const dir of directories) {
    if (fs.existsSync(dir.path)) {
      const files = fs.readdirSync(dir.path);
      log(`✅ ${dir.path}/ (${files.length} 个文件) - ${dir.description}`, 'success');
    } else if (dir.optional) {
      log(`⚠️  ${dir.path}/ - ${dir.description} (可选，构建时创建)`, 'warn');
    } else {
      log(`❌ ${dir.path}/ - ${dir.description} (必需)`, 'error');
    }
  }
}

function generateReport() {
  log('\n生成 CI/CD 状态报告...');

  const report = {
    timestamp: new Date().toISOString(),
    status: 'checked',
    workflows: {},
    scripts: {},
    git: null,
    directories: {},
  };

  // 检查工作流文件
  for (const workflow of REQUIRED_WORKFLOWS) {
    const workflowPath = path.join(WORKFLOWS_DIR, workflow);
    report.workflows[workflow] = {
      exists: fs.existsSync(workflowPath),
      config: WORKFLOW_CONFIGS[workflow],
    };
  }

  // 检查 package.json 脚本
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    report.scripts = packageJson.scripts || {};
  }

  // 检查 Git 状态
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    report.git = {
      inRepo: true,
      branch,
      hasGitHub: remotes.includes('github.com'),
    };
  } catch (error) {
    report.git = { inRepo: false };
  }

  // 保存报告
  const reportPath = 'cicd-status-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📋 状态报告已保存: ${reportPath}`, 'success');

  return report;
}

function displaySummary(report) {
  log('\n📊 CI/CD 配置状态总结');
  log('=' + '='.repeat(50));

  const workflowCount = Object.values(report.workflows).filter(w => w.exists).length;
  const totalWorkflows = Object.keys(report.workflows).length;

  log(`工作流文件: ${workflowCount}/${totalWorkflows} 个已配置`);
  log(`Git 仓库: ${report.git?.inRepo ? '✅' : '❌'}`);
  log(`GitHub 远程: ${report.git?.hasGitHub ? '✅' : '❌'}`);

  if (workflowCount === totalWorkflows && report.git?.inRepo && report.git?.hasGitHub) {
    log('\n🎉 CI/CD 配置完整！可以使用自动化发布功能', 'success');
    log('\n💡 使用方法:');
    log('1. 进入 GitHub 仓库的 "Releases" 页面');
    log('2. 点击 "Create a new release" 创建新版本');
    log('3. 系统会自动构建并上传所有平台的程序包');
  } else {
    log('\n⚠️  CI/CD 配置不完整，请检查上述问题', 'warn');
  }
}

function main() {
  console.clear();
  log('🔍 开始 CI/CD 状态检查...');
  log('=' + '='.repeat(52));

  const checks = [checkWorkflowFiles, checkPackageScripts, checkBuildScripts, checkGitStatus, checkDirectories];

  let allPassed = true;
  for (const check of checks) {
    if (!check()) {
      allPassed = false;
    }
  }

  const report = generateReport();
  displaySummary(report);

  if (allPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// 帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
CI/CD 状态检查脚本

用法:
  node check-cicd.js

功能:
  - 检查 GitHub Actions 工作流配置
  - 验证构建脚本完整性
  - 检查 Git 仓库状态
  - 生成配置状态报告

输出:
  - cicd-status-report.json: 详细状态报告

示例:
  node check-cicd.js              # 完整检查
  node check-cicd.js --help       # 显示帮助
`);
  process.exit(0);
}

main();

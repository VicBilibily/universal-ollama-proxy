#!/usr/bin/env node

/**
 * CI/CD 状态检查脚本
 * 检查 GitHub Actions 工作流配置和状态
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { logger } = require('./utils/logger');

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

// 使用统一的logger系统
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

function checkWorkflowFiles() {
  log.info('检查工作流文件...');

  if (!fs.existsSync(WORKFLOWS_DIR)) {
    log.error(`工作流目录不存在: ${WORKFLOWS_DIR}`);
    return false;
  }

  let allExists = true;

  for (const workflow of REQUIRED_WORKFLOWS) {
    const workflowPath = path.join(WORKFLOWS_DIR, workflow);
    const config = WORKFLOW_CONFIGS[workflow];

    if (fs.existsSync(workflowPath)) {
      log.success(`✅ ${config.name} (${workflow})`);
      log.info(`   描述: ${config.description}`);
      log.info(`   触发: ${config.triggers.join(', ')}`);
    } else {
      log.error(`❌ ${config.name} (${workflow}) - 文件不存在`);
      allExists = false;
    }
  }

  return allExists;
}

function checkPackageScripts() {
  log.info('\n检查 package.json 脚本...');

  const packagePath = 'package.json';
  if (!fs.existsSync(packagePath)) {
    log.error('package.json 不存在');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};

  const requiredScripts = ['build', 'lint', 'build:binaries', 'verify:binaries', 'create:release', 'release'];

  let allScriptsExist = true;

  for (const script of requiredScripts) {
    if (scripts[script]) {
      log.success(`✅ ${script}: ${scripts[script]}`);
    } else {
      log.error(`❌ ${script} - 脚本不存在`);
      allScriptsExist = false;
    }
  }

  return allScriptsExist;
}

function checkBuildScripts() {
  log.info('\n检查构建脚本...');

  const buildScripts = ['build-binaries.js', 'create-release.js', 'verify-binaries.js', 'verify-releases.js'];

  let allScriptsExist = true;

  for (const script of buildScripts) {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
      const stats = fs.statSync(scriptPath);
      log.success(`✅ ${script} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      log.error(`❌ ${script} - 文件不存在`);
      allScriptsExist = false;
    }
  }

  return allScriptsExist;
}

function checkGitStatus() {
  log.info('\n检查 Git 状态...');

  try {
    // 检查是否在 Git 仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });

    // 检查远程仓库
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    if (remotes.includes('github.com')) {
      log.success('✅ 检测到 GitHub 远程仓库');
    } else {
      log.warn('⚠️  未检测到 GitHub 远程仓库');
    }

    // 检查当前分支
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log.success(`✅ 当前分支: ${branch}`);

    return true;
  } catch (error) {
    log.error('❌ 不在 Git 仓库中或 Git 配置有问题');
    return false;
  }
}

function checkDirectories() {
  log.info('\n检查目录结构...');

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
      log.success(`✅ ${dir.path}/ (${files.length} 个文件) - ${dir.description}`);
    } else if (dir.optional) {
      log.warn(`⚠️  ${dir.path}/ - ${dir.description} (可选，构建时创建)`);
    } else {
      log.error(`❌ ${dir.path}/ - ${dir.description} (必需)`);
    }
  }
}

function generateReport() {
  log.info('\n生成 CI/CD 状态报告...');

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
  const logsDir = path.join(__dirname, '..', 'logs', 'status');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const reportPath = path.join(logsDir, 'cicd-status-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`📋 状态报告已保存: ${path.relative(process.cwd(), reportPath)}`);

  return report;
}

function displaySummary(report) {
  log.info('\n📊 CI/CD 配置状态总结');
  log.info('=' + '='.repeat(50));

  const workflowCount = Object.values(report.workflows).filter(w => w.exists).length;
  const totalWorkflows = Object.keys(report.workflows).length;

  log.info(`工作流文件: ${workflowCount}/${totalWorkflows} 个已配置`);
  log.info(`Git 仓库: ${report.git?.inRepo ? '✅' : '❌'}`);
  log.info(`GitHub 远程: ${report.git?.hasGitHub ? '✅' : '❌'}`);

  if (workflowCount === totalWorkflows && report.git?.inRepo && report.git?.hasGitHub) {
    log.success('\n🎉 CI/CD 配置完整！可以使用自动化发布功能');
    log.info('\n💡 使用方法:');
    log.info('1. 进入 GitHub 仓库的 "Releases" 页面');
    log.info('2. 点击 "Create a new release" 创建新版本');
    log.info('3. 系统会自动构建并上传所有平台的程序包');
  } else {
    log.warn('\n⚠️  CI/CD 配置不完整，请检查上述问题');
  }
}

function main() {
  console.clear();
  log.info('🔍 开始 CI/CD 状态检查...');
  log.info('=' + '='.repeat(52));

  const checks = [checkWorkflowFiles, checkPackageScripts, checkBuildScripts, checkGitStatus, checkDirectories];

  let allPassed = true;
  for (const check of checks) {
    if (!check()) {
      allPassed = false;
    }
  }

  const report = generateReport();
  displaySummary(report);

  // 始终以成功状态退出，因为这只是一个信息性检查
  process.exit(0);
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
  node scripts/check-cicd.js              # 完整检查
  node scripts/check-cicd.js --help       # 显示帮助
`);
  process.exit(0);
}

main();

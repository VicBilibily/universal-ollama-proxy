#!/usr/bin/env node

/**
 * GitHub Actions 状态监控脚本
 * 检查工作流运行状态和历史记录
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');

// 使用统一的logger，使用中文本地时间格式
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

/**
 * 从 package.json 获取仓库信息
 */
function getRepositoryInfo() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // 尝试从 repository 字段获取
    if (packageJson.repository) {
      const repo = packageJson.repository.url || packageJson.repository;
      // 支持不同格式的 GitHub URL，包括 git+https://
      const match = repo.match(/(?:git\+)?(?:https?:\/\/)?(?:github\.com[:/]|git@github\.com:)([^/]+)\/([^/.]+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2],
        };
      }
    }

    // 如果没有找到，返回默认值（需要用户修改）
    return {
      owner: 'VicBilibily',
      repo: 'universal-ollama-proxy',
    };
  } catch (error) {
    log.warn('无法读取 package.json，使用默认仓库信息');
    return {
      owner: 'VicBilibily',
      repo: 'universal-ollama-proxy',
    };
  }
}

/**
 * 获取 GitHub Actions 工作流状态
 */
function getWorkflowRuns(owner, repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/actions/runs?per_page=10`,
      method: 'GET',
      headers: {
        'User-Agent': 'universal-ollama-proxy-monitor',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', error => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

/**
 * 格式化工作流状态
 */
function formatWorkflowStatus(status, conclusion) {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success':
        return '✅ 成功';
      case 'failure':
        return '❌ 失败';
      case 'cancelled':
        return '⚠️ 已取消';
      case 'skipped':
        return '⏭️ 已跳过';
      default:
        return `❓ ${conclusion}`;
    }
  } else {
    switch (status) {
      case 'in_progress':
        return '🔄 进行中';
      case 'queued':
        return '⏳ 排队中';
      case 'requested':
        return '📝 已请求';
      default:
        return `❓ ${status}`;
    }
  }
}

/**
 * 显示工作流状态
 */
async function showWorkflowStatus() {
  log.info('📊 GitHub Actions 状态监控');
  log.info('='.repeat(60));

  const { owner, repo } = getRepositoryInfo();
  log.info(`仓库: ${owner}/${repo}`);

  try {
    log.info('\n🔍 获取工作流运行记录...');
    const data = await getWorkflowRuns(owner, repo);

    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      log.warn('没有找到工作流运行记录');
      log.info('💡 可能原因:');
      log.info('  - 还没有触发过工作流');
      log.info('  - 仓库是私有的且没有访问权限');
      log.info('  - 仓库信息不正确');
      return;
    }

    log.success(`找到 ${data.workflow_runs.length} 条运行记录\n`);

    // 按工作流分组
    const workflowGroups = {};
    data.workflow_runs.forEach(run => {
      const workflowName = run.name;
      if (!workflowGroups[workflowName]) {
        workflowGroups[workflowName] = [];
      }
      workflowGroups[workflowName].push(run);
    });

    // 显示每个工作流的状态
    Object.keys(workflowGroups).forEach(workflowName => {
      const runs = workflowGroups[workflowName];
      const latestRun = runs[0]; // API 返回的是按时间倒序排列的

      log.info(`🔧 ${workflowName}`);
      log.info(`   最新状态: ${formatWorkflowStatus(latestRun.status, latestRun.conclusion)}`);
      log.info(`   运行时间: ${new Date(latestRun.created_at).toLocaleString()}`);
      log.info(`   触发事件: ${latestRun.event}`);
      log.info(`   分支: ${latestRun.head_branch}`);
      log.info(`   链接: ${latestRun.html_url}`);
      log.info('');
    });

    // 显示统计信息
    const totalRuns = data.workflow_runs.length;
    const successRuns = data.workflow_runs.filter(run => run.conclusion === 'success').length;
    const failureRuns = data.workflow_runs.filter(run => run.conclusion === 'failure').length;
    const inProgressRuns = data.workflow_runs.filter(run => run.status === 'in_progress').length;

    log.info('📈 统计信息');
    log.info('-'.repeat(30));
    log.info(`总运行次数: ${totalRuns}`);
    log.info(`成功: ${successRuns}`);
    log.info(`失败: ${failureRuns}`);
    log.info(`进行中: ${inProgressRuns}`);

    if (totalRuns > 0) {
      const successRate = ((successRuns / totalRuns) * 100).toFixed(1);
      log.info(`成功率: ${successRate}%`);
    }

    // 保存详细报告
    const report = {
      timestamp: new Date().toISOString(),
      repository: { owner, repo },
      summary: {
        totalRuns,
        successRuns,
        failureRuns,
        inProgressRuns,
        successRate: totalRuns > 0 ? ((successRuns / totalRuns) * 100).toFixed(1) : 0,
      },
      workflows: workflowGroups,
      rawData: data.workflow_runs,
    };

    // 创建日志状态目录（如果不存在）
    const logsDir = path.join(__dirname, '..', 'logs', 'status');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // 保存到状态目录
    const statusFile = path.join(logsDir, 'github-actions-status.json');
    fs.writeFileSync(statusFile, JSON.stringify(report, null, 2));
    log.success(`\n📋 详细状态已保存: ${statusFile}`);
  } catch (error) {
    log.error(`获取工作流状态失败: ${error.message}`);

    if (error.message.includes('API rate limit')) {
      log.info('💡 GitHub API 速率限制，请稍后重试');
    } else if (error.message.includes('Not Found')) {
      log.info('💡 仓库不存在或没有访问权限');
      log.info('   请检查仓库信息是否正确');
    } else {
      log.info('💡 请检查网络连接和仓库信息');
    }
  }
}

/**
 * 显示本地 CI/CD 状态
 */
function showLocalStatus() {
  log.info('');
  log.info('🏠 本地 CI/CD 状态');
  log.info('-'.repeat(30));

  // 检查工作流文件
  const workflowFiles = ['.github/workflows/ci.yml', '.github/workflows/release.yml'];

  workflowFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`${file}`);
    } else {
      log.error(`${file} (缺失)`);
    }
  });

  // 检查构建产物
  if (fs.existsSync('binaries')) {
    const binaries = fs.readdirSync('binaries').length;
    log.info(`📦 二进制文件: ${binaries} 个`);
  } else {
    log.warn('📦 二进制文件: 目录不存在');
  }

  if (fs.existsSync('releases')) {
    const releases = fs.readdirSync('releases').length;
    log.info(`🎁 发布包: ${releases} 个`);
  } else {
    log.warn('🎁 发布包: 目录不存在');
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const showLocal = args.includes('--local') || args.includes('-l');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
GitHub Actions 状态监控工具

用法:
  node monitor-actions.js [选项]

选项:
  --local, -l    只显示本地状态
  --help, -h     显示帮助信息

示例:
  node monitor-actions.js          # 显示 GitHub 和本地状态
  node monitor-actions.js --local  # 只显示本地状态
`);
    return;
  }

  if (showLocal) {
    showLocalStatus();
  } else {
    await showWorkflowStatus();
    showLocalStatus();
  }
}

// 如果直接运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { showWorkflowStatus, showLocalStatus };

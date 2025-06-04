#!/usr/bin/env node

/**
 * GitHub Actions 状态监控脚本
 * 检查工作流运行状态和历史记录
 */

const https = require('https');
const fs = require('fs');

/**
 * 日志工具
 */
const logger = {
  info: message => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [INFO] ${message}`);
  },
  success: message => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [SUCCESS] ✅ ${message}`);
  },
  error: message => {
    const timestamp = new Date().toISOString();
    console.error(`${timestamp} [ERROR] ❌ ${message}`);
  },
  warn: message => {
    const timestamp = new Date().toISOString();
    console.warn(`${timestamp} [WARN] ⚠️ ${message}`);
  },
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
      const match = repo.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
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
    logger.warn('无法读取 package.json，使用默认仓库信息');
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
  logger.info('📊 GitHub Actions 状态监控');
  logger.info('='.repeat(60));

  const { owner, repo } = getRepositoryInfo();
  logger.info(`仓库: ${owner}/${repo}`);

  if (owner === 'VicBilibily') {
    logger.warn('⚠️ 检测到默认仓库信息，请在 package.json 中配置正确的 repository 字段');
    logger.info('示例配置:');
    logger.info('"repository": {');
    logger.info('  "type": "git",');
    logger.info('  "url": "https://github.com/VicBilibily/universal-ollama-proxy.git"');
    logger.info('}');
    return;
  }

  try {
    logger.info('\\n🔍 获取工作流运行记录...');
    const data = await getWorkflowRuns(owner, repo);

    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      logger.warn('没有找到工作流运行记录');
      logger.info('💡 可能原因:');
      logger.info('  - 还没有触发过工作流');
      logger.info('  - 仓库是私有的且没有访问权限');
      logger.info('  - 仓库信息不正确');
      return;
    }

    logger.success(`找到 ${data.workflow_runs.length} 条运行记录\\n`);

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

      logger.info(`🔧 ${workflowName}`);
      logger.info(`   最新状态: ${formatWorkflowStatus(latestRun.status, latestRun.conclusion)}`);
      logger.info(`   运行时间: ${new Date(latestRun.created_at).toLocaleString()}`);
      logger.info(`   触发事件: ${latestRun.event}`);
      logger.info(`   分支: ${latestRun.head_branch}`);
      logger.info(`   链接: ${latestRun.html_url}`);
      logger.info('');
    });

    // 显示统计信息
    const totalRuns = data.workflow_runs.length;
    const successRuns = data.workflow_runs.filter(run => run.conclusion === 'success').length;
    const failureRuns = data.workflow_runs.filter(run => run.conclusion === 'failure').length;
    const inProgressRuns = data.workflow_runs.filter(run => run.status === 'in_progress').length;

    logger.info('📈 统计信息');
    logger.info('-'.repeat(30));
    logger.info(`总运行次数: ${totalRuns}`);
    logger.info(`成功: ${successRuns}`);
    logger.info(`失败: ${failureRuns}`);
    logger.info(`进行中: ${inProgressRuns}`);

    if (totalRuns > 0) {
      const successRate = ((successRuns / totalRuns) * 100).toFixed(1);
      logger.info(`成功率: ${successRate}%`);
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

    fs.writeFileSync('github-actions-status.json', JSON.stringify(report, null, 2));
    logger.success('\\n📋 详细状态已保存: github-actions-status.json');
  } catch (error) {
    logger.error(`获取工作流状态失败: ${error.message}`);

    if (error.message.includes('API rate limit')) {
      logger.info('💡 GitHub API 速率限制，请稍后重试');
    } else if (error.message.includes('Not Found')) {
      logger.info('💡 仓库不存在或没有访问权限');
      logger.info('   请检查仓库信息是否正确');
    } else {
      logger.info('💡 请检查网络连接和仓库信息');
    }
  }
}

/**
 * 显示本地 CI/CD 状态
 */
function showLocalStatus() {
  logger.info('\\n🏠 本地 CI/CD 状态');
  logger.info('-'.repeat(30));

  // 检查工作流文件
  const workflowFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/release.yml',
    '.github/workflows/auto-release.yml',
  ];

  workflowFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logger.success(`${file}`);
    } else {
      logger.error(`${file} (缺失)`);
    }
  });

  // 检查构建产物
  if (fs.existsSync('binaries')) {
    const binaries = fs.readdirSync('binaries').length;
    logger.info(`📦 二进制文件: ${binaries} 个`);
  } else {
    logger.warn('📦 二进制文件: 目录不存在');
  }

  if (fs.existsSync('releases')) {
    const releases = fs.readdirSync('releases').length;
    logger.info(`🎁 发布包: ${releases} 个`);
  } else {
    logger.warn('🎁 发布包: 目录不存在');
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

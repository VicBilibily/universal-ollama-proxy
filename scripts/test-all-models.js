#!/usr/bin/env node

/**
 * 模型测试脚本
 * 通过 /api/tags 获取模型列表，然后使用 /v1/chat/completions 测试所有模型
 */

const http = require('http');
const https = require('https');
const url = require('url');
const { logger } = require('./utils/logger');

// 配置
const config = {
  baseUrl: 'http://localhost:11434',
  testMessage: '你好，请简短回复',
  maxConcurrent: 3, // 最大并发数
  timeout: 30000, // 30秒超时
};

// 结果统计
const results = {
  successful: [],
  failed: [],
  total: 0,
  startTime: new Date(),
};

// 使用统一的logger系统
const log = {
  info: message => logger.info(message, false),
  success: message => logger.success(message, false),
  error: message => logger.error(message, false),
  warn: message => logger.warn(message, false),
};

/**
 * 发送HTTP请求
 */
function makeRequest(requestUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = url.parse(requestUrl);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Model-Tester/1.0',
        ...options.headers,
      },
      timeout: config.timeout,
    };

    const req = httpModule.request(requestOptions, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data,
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message,
          });
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 获取模型列表
 */
async function getModels() {
  log.info('📋 正在获取模型列表...');

  try {
    const response = await makeRequest(`${config.baseUrl}/api/tags`);

    if (response.statusCode !== 200) {
      throw new Error(`获取模型列表失败: ${response.statusCode} ${response.data}`);
    }

    if (!response.data || !response.data.models) {
      throw new Error('模型列表响应格式错误');
    }

    // 返回包含模型ID和显示名称的对象数组
    const models = response.data.models.map(model => ({
      id: model.model,
      name: model.name,
      displayName: model.name || model.model,
    }));

    log.success(`✅ 成功获取 ${models.length} 个模型:`);
    models.forEach((model, index) => {
      console.log(`   ${index + 1}. ${model.id} (${model.displayName})`);
    });

    return models;
  } catch (error) {
    log.error(`❌ 获取模型列表失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试单个模型
 */
async function testModel(modelInfo) {
  const startTime = Date.now();

  try {
    // 使用友好的显示名称
    const { id: modelId, displayName } = modelInfo;

    console.log(`🧪 测试模型: ${modelId}`);

    const response = await makeRequest(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      body: {
        model: modelId, // 使用正确的模型ID进行API调用
        messages: [
          {
            role: 'user',
            content: config.testMessage,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
        stream: false,
      },
    });

    const duration = Date.now() - startTime;

    if (response.statusCode === 200) {
      const data = response.data;

      if (data && data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        const replyContent = choice.message?.content || choice.text || '无回复内容';

        console.log(`✅ ${displayName} - 成功 (${duration}ms)`);
        console.log(`   回复: ${replyContent.substring(0, 100)}${replyContent.length > 100 ? '...' : ''}`);

        if (data.usage) {
          console.log(
            `   Token用量: ${data.usage.prompt_tokens || 0}+${data.usage.completion_tokens || 0}=${data.usage.total_tokens || 0}`
          );
        }

        return {
          model: modelId,
          displayName: displayName,
          success: true,
          duration,
          response: replyContent,
          usage: data.usage,
          statusCode: response.statusCode,
        };
      } else {
        throw new Error('响应格式错误：缺少 choices 字段');
      }
    } else {
      const errorMsg = response.data?.error?.message || response.data?.message || JSON.stringify(response.data);
      throw new Error(`HTTP ${response.statusCode}: ${errorMsg}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const { displayName, id: modelId } = modelInfo;
    console.log(`❌ ${displayName} - 失败 (${duration}ms): ${error.message}`);

    return {
      model: modelId,
      displayName: displayName,
      success: false,
      duration,
      error: error.message,
    };
  }
}

/**
 * 批量测试模型（控制并发数）
 */
async function testModelsInBatches(models) {
  console.log(`\n🚀 开始测试 ${models.length} 个模型 (最大并发: ${config.maxConcurrent})\n`);

  const results = [];

  for (let i = 0; i < models.length; i += config.maxConcurrent) {
    const batch = models.slice(i, i + config.maxConcurrent);
    console.log(`📦 批次 ${Math.floor(i / config.maxConcurrent) + 1}: 测试 ${batch.length} 个模型`);

    const batchPromises = batch.map(modelInfo => testModel(modelInfo));
    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults);

    // 批次间暂停
    if (i + config.maxConcurrent < models.length) {
      console.log('⏳ 批次间休息 2 秒...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * 生成测试报告
 */
function generateReport(testResults) {
  const successful = testResults.filter(r => r.success);
  const failed = testResults.filter(r => !r.success);
  const totalDuration = Date.now() - results.startTime.getTime();

  console.log('\n' + '='.repeat(80));
  console.log('📊 测试报告');
  console.log('='.repeat(80));

  console.log(`\n📈 总体统计:`);
  console.log(`   总模型数: ${testResults.length}`);
  console.log(`   成功: ${successful.length} (${((successful.length / testResults.length) * 100).toFixed(1)}%)`);
  console.log(`   失败: ${failed.length} (${((failed.length / testResults.length) * 100).toFixed(1)}%)`);
  console.log(`   总耗时: ${(totalDuration / 1000).toFixed(1)}秒`);

  if (successful.length > 0) {
    console.log(`\n✅ 成功的模型 (${successful.length}个):`);
    successful.forEach((result, index) => {
      const displayName =
        result.displayName || (result.model.includes(':') ? result.model.split(':')[1] : result.model);
      console.log(`   ${index + 1}. ${displayName} - ${result.duration}ms`);
    });

    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`   平均响应时间: ${avgDuration.toFixed(0)}ms`);
  }

  if (failed.length > 0) {
    console.log(`\n❌ 失败的模型 (${failed.length}个):`);
    failed.forEach((result, index) => {
      const displayName =
        result.displayName || (result.model.includes(':') ? result.model.split(':')[1] : result.model);
      console.log(`   ${index + 1}. ${displayName} - ${result.error}`);
    });

    // 统计错误类型
    const errorCounts = {};
    failed.forEach(result => {
      const errorType = result.error.split(':')[0];
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    console.log(`\n📋 错误类型统计:`);
    Object.entries(errorCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}次`);
    });
  }

  // 保存详细报告到文件
  const reportData = {
    summary: {
      total: testResults.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / testResults.length) * 100,
      totalDuration: totalDuration,
      averageResponseTime:
        successful.length > 0 ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length : 0,
    },
    successful: successful,
    failed: failed,
    timestamp: new Date().toISOString(),
    config: config,
  };

  // 保存到项目的logs目录，遵循项目目录结构
  const fs = require('fs');
  const path = require('path');

  // 确保logs/test目录存在
  const logsDir = path.join(__dirname, '..', 'logs', 'test');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // 生成时间戳格式的文件名，保持与项目其他日志文件一致
  const timestamp = new Date().toISOString().replace(/[:]/g, '').replace(/\./g, '').slice(0, 17);
  const reportFile = path.join(logsDir, `model-test-${timestamp}.json`);

  try {
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    log.success(`💾 详细报告已保存到: ${path.relative(process.cwd(), reportFile)}`);

    // 同时生成简要的markdown报告
    const markdownReport = generateMarkdownReport(testResults, successful, failed, totalDuration);
    const markdownFile = path.join(logsDir, `model-test-${timestamp}.md`);
    fs.writeFileSync(markdownFile, markdownReport);
    log.success(`📝 Markdown报告已保存到: ${path.relative(process.cwd(), markdownFile)}`);
  } catch (error) {
    log.warn(`⚠️  保存报告失败: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * 生成Markdown格式的报告
 */
function generateMarkdownReport(testResults, successful, failed, totalDuration) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const successRate = ((successful.length / testResults.length) * 100).toFixed(1);

  let markdown = `# AI 模型测试报告\n\n`;
  markdown += `**测试时间**: ${timestamp}\n`;
  markdown += `**服务地址**: ${config.baseUrl}\n`;
  markdown += `**测试消息**: "${config.testMessage}"\n\n`;

  markdown += `## 📊 总体统计\n\n`;
  markdown += `| 指标 | 数值 |\n`;
  markdown += `|------|------|\n`;
  markdown += `| 总模型数 | ${testResults.length} |\n`;
  markdown += `| 成功数量 | ${successful.length} (${successRate}%) |\n`;
  markdown += `| 失败数量 | ${failed.length} (${(100 - successRate).toFixed(1)}%) |\n`;
  markdown += `| 总耗时 | ${(totalDuration / 1000).toFixed(1)}秒 |\n`;

  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    markdown += `| 平均响应时间 | ${avgDuration.toFixed(0)}ms |\n`;
  }

  if (successful.length > 0) {
    markdown += `\n## ✅ 成功的模型 (${successful.length}个)\n\n`;
    markdown += `| 序号 | 模型名称 | 响应时间 |\n`;
    markdown += `|------|----------|----------|\n`;
    successful.forEach((result, index) => {
      const displayName =
        result.displayName || (result.model.includes(':') ? result.model.split(':')[1] : result.model);
      markdown += `| ${index + 1} | ${displayName} | ${result.duration}ms |\n`;
    });
  }

  if (failed.length > 0) {
    markdown += `\n## ❌ 失败的模型 (${failed.length}个)\n\n`;
    markdown += `| 序号 | 模型名称 | 错误信息 |\n`;
    markdown += `|------|----------|----------|\n`;
    failed.forEach((result, index) => {
      const displayName =
        result.displayName || (result.model.includes(':') ? result.model.split(':')[1] : result.model);
      markdown += `| ${index + 1} | ${displayName} | ${result.error} |\n`;
    });

    // 错误类型统计
    const errorCounts = {};
    failed.forEach(result => {
      const errorType = result.error.split(':')[0];
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    markdown += `\n## 📋 错误类型统计\n\n`;
    markdown += `| 错误类型 | 出现次数 |\n`;
    markdown += `|----------|----------|\n`;
    Object.entries(errorCounts).forEach(([type, count]) => {
      markdown += `| ${type} | ${count} |\n`;
    });
  }

  return markdown;
}

/**
 * 主函数
 */
async function main() {
  console.log('🎯 AI 模型统一代理 - 模型测试工具');
  console.log(`🌐 服务地址: ${config.baseUrl}`);
  console.log(`💬 测试消息: "${config.testMessage}"`);
  console.log(`⏱️  超时时间: ${config.timeout / 1000}秒`);
  console.log(`🔄 最大并发: ${config.maxConcurrent}`);
  console.log('');

  try {
    // 获取模型列表
    const models = await getModels();

    if (models.length === 0) {
      console.log('⚠️  没有找到可用的模型');
      return;
    }

    // 测试所有模型
    const testResults = await testModelsInBatches(models);

    // 生成报告
    generateReport(testResults);
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 处理命令行参数
if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  args.forEach(arg => {
    if (arg.startsWith('--url=')) {
      config.baseUrl = arg.split('=')[1];
    } else if (arg.startsWith('--message=')) {
      config.testMessage = arg.split('=')[1];
    } else if (arg.startsWith('--concurrent=')) {
      config.maxConcurrent = parseInt(arg.split('=')[1]) || 3;
    } else if (arg.startsWith('--timeout=')) {
      config.timeout = parseInt(arg.split('=')[1]) * 1000 || 30000;
    } else if (arg === '--help' || arg === '-h') {
      console.log('用法: node test-all-models.js [选项]');
      console.log('');
      console.log('选项:');
      console.log('  --url=URL          设置服务器地址 (默认: http://localhost:11434)');
      console.log('  --message=MSG      设置测试消息 (默认: "你好，请简短回复")');
      console.log('  --concurrent=N     设置最大并发数 (默认: 3)');
      console.log('  --timeout=N        设置超时时间(秒) (默认: 30)');
      console.log('  --help, -h         显示此帮助信息');
      console.log('');
      console.log('示例:');
      console.log('  node test-all-models.js');
      console.log('  node test-all-models.js --url=http://localhost:8080 --concurrent=5');
      console.log('  node test-all-models.js --message="测试消息" --timeout=60');
      process.exit(0);
    }
  });
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序异常退出:', error);
    process.exit(1);
  });
}

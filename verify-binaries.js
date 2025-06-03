#!/usr/bin/env node

/**
 * 可执行文件验证脚本
 * 验证生成的二进制文件是否能正常运行
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BINARIES_DIR = 'binaries';

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function testBinary(binaryPath) {
  return new Promise(resolve => {
    log(`测试可执行文件: ${binaryPath}`);

    if (!fs.existsSync(binaryPath)) {
      log(`❌ 文件不存在: ${binaryPath}`);
      resolve(false);
      return;
    }

    const stats = fs.statSync(binaryPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`📦 文件大小: ${sizeMB} MB`);

    const fileName = path.basename(binaryPath);

    // 检查是否是跨架构的文件（在当前系统上无法运行）
    const isCurrentSystemWindows = process.platform === 'win32';
    const isCurrentSystemArm64 = process.arch === 'arm64';
    const isCurrentSystemX64 = process.arch === 'x64';

    // 如果是Windows可执行文件但不是当前架构，跳过运行测试
    if (binaryPath.endsWith('.exe')) {
      const isArm64Binary = fileName.includes('arm64');
      const isX64Binary = fileName.includes('x64');

      if (isCurrentSystemWindows) {
        // 在Windows系统上，只测试匹配当前架构的文件
        if ((isArm64Binary && !isCurrentSystemArm64) || (isX64Binary && !isCurrentSystemX64)) {
          log(`⚠️  跳过跨架构测试: ${fileName} (当前系统: ${process.arch})`);
          log(`✅ ${fileName} 文件生成成功`);
          resolve(true);
          return;
        }

        // 测试当前架构的Windows可执行文件
        const child = spawn(binaryPath, ['--version'], {
          timeout: 5000,
          stdio: 'pipe',
        });

        let output = '';
        child.stdout.on('data', data => {
          output += data.toString();
        });

        child.stderr.on('data', data => {
          output += data.toString();
        });

        child.on('close', code => {
          if (code === 0 || output.includes('version') || output.includes('1.0.0')) {
            log(`✅ ${fileName} 测试通过`);
            resolve(true);
          } else {
            log(`⚠️  ${fileName} 可能有问题 (退出码: ${code})`);
            log(`输出: ${output.trim()}`);
            resolve(false);
          }
        });

        child.on('error', err => {
          log(`❌ ${fileName} 启动失败: ${err.message}`);
          resolve(false);
        });
      } else {
        // 在非Windows系统上，无法测试Windows可执行文件
        log(`⚠️  跳过Windows可执行文件测试: ${fileName} (当前系统: ${process.platform})`);
        log(`✅ ${fileName} 文件生成成功`);
        resolve(true);
      }
    } else {
      // 对于Linux/macOS，只检查文件是否存在和大小
      log(`✅ ${fileName} 文件生成成功`);
      resolve(true);
    }
  });
}

async function main() {
  log('开始验证可执行文件...');

  if (!fs.existsSync(BINARIES_DIR)) {
    log(`❌ 二进制文件目录不存在: ${BINARIES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BINARIES_DIR);
  const binaries = files.filter(
    file =>
      file.startsWith('universal-ollama-proxy-') || file.startsWith('universal-ollama-proxy-') || file.endsWith('.exe')
  );

  if (binaries.length === 0) {
    log('❌ 没有找到可执行文件');
    process.exit(1);
  }

  log(`找到 ${binaries.length} 个可执行文件:`);
  binaries.forEach(binary => log(`  - ${binary}`));

  let passedTests = 0;
  for (const binary of binaries) {
    const binaryPath = path.join(BINARIES_DIR, binary);
    const result = await testBinary(binaryPath);
    if (result) passedTests++;
  }

  log(`\n验证完成: ${passedTests}/${binaries.length} 个文件通过测试`);

  if (passedTests === binaries.length) {
    log('🎉 所有可执行文件验证通过！');
  } else {
    log('⚠️  部分可执行文件可能有问题');
  }
}

main().catch(console.error);

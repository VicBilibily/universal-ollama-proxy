// 禁用实验性功能警告
process.removeAllListeners('warning');
process.on('warning', warning => {
  // 忽略 fetch API 的实验性警告
  if (warning.name === 'ExperimentalWarning' && warning.message.includes('Fetch API')) {
    return;
  }
  // 其他警告仍然显示
  console.warn(warning.name, warning.message);
});

// 首先导入 polyfills
import dotenv from 'dotenv';
import App from './app';
import './polyfills';
import { logger } from './utils';

// 加载环境变量
dotenv.config();

// 未捕获异常处理
process.on('uncaughtException', (error: Error) => {
  logger.error('未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，准备关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，准备关闭服务器...');
  process.exit(0);
});

// 启动应用
async function startServer() {
  let app: App | null = null;

  try {
    app = new App();

    // 等待异步初始化完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    app.listen();

    // 设置优雅关闭处理器
    const gracefulShutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭服务器...`);

      if (app) {
        await app.gracefulShutdown();
      }

      process.exit(0);
    };

    // 重新注册信号处理器
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('服务器启动失败:', error);

    if (app) {
      await app.gracefulShutdown();
    }

    process.exit(1);
  }
}

startServer();

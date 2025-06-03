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

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
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
  try {
    const app = new App();

    // 等待异步初始化完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    app.listen();
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

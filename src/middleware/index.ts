import { NextFunction, Request, Response } from 'express';
import { OllamaError, logger } from '../utils';

/**
 * 错误处理中间件
 */
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('请求处理错误:', error);

  if (error instanceof OllamaError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code || 'OLLAMA_ERROR',
      },
    });
    return;
  }

  // 默认错误处理
  res.status(500).json({
    error: {
      message: '内部服务器错误',
      code: 'INTERNAL_ERROR',
    },
  });
};

/**
 * 请求日志中间件 - 与morgan配合使用
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // 记录请求开始（仅调试模式）
  const userAgent = req.get('user-agent');
  const contentType = req.get('content-type');
  const contentLength = req.get('content-length');
  logger.debug(
    `开始处理请求: ${req.method} ${req.path}，用户代理: ${userAgent}，内容类型: ${contentType}，内容长度: ${contentLength}`
  );

  res.on('finish', () => {
    const duration = Date.now() - start;

    // 根据状态码选择日志级别和格式
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    } else {
      // 成功请求不重复记录，由morgan处理
      logger.debug(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
};

/**
 * 请求体大小限制检查（内网优化版本）
 */
export const validateRequestSize = (req: Request, res: Response, next: NextFunction): void => {
  // 内网环境下放宽限制，仅记录大请求
  const contentLength = req.get('content-length');
  const warnSize = 50 * 1024 * 1024; // 50MB警告阈值

  if (contentLength && parseInt(contentLength) > warnSize) {
    const sizeInMB = (parseInt(contentLength) / 1024 / 1024).toFixed(2);
    logger.warn(`检测到大请求: ${sizeInMB}MB，路径: ${req.path}，方法: ${req.method}`);
  }

  next();
};

/**
 * 流式响应辅助中间件
 */
export const setupStreamResponse = (req: Request, res: Response, next: NextFunction): void => {
  // 为流式响应设置适当的头部
  if (req.query.stream === 'true' || req.body?.stream === true) {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  next();
};

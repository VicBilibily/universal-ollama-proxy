/**
 * 错误处理
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

/**
 * 导入日志工具
 */
export { logger } from './logger';

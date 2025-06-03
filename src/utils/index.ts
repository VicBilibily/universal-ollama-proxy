import { OllamaChatMessage } from '../types';

/**
 * 将 Ollama 消息格式转换为火山方舟引擎格式
 */
export const convertOllamaToVolcEngine = (messages: OllamaChatMessage[]): Array<{ role: string; content: string }> => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
};

/**
 * 生成当前时间戳
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 生成随机 ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * 验证模型名称是否支持
 */
export const validateModel = (model: string, supportedModels: string[]): boolean => {
  return supportedModels.includes(model);
};

/**
 * 格式化模型大小
 */
export const formatModelSize = (sizeInBytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * 延迟函数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

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
 * 火山方舟引擎错误处理
 */
export class VolcEngineError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'VolcEngineError';
  }
}

/**
 * 颜色常量
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * 格式化时间戳（更简洁的格式）
 */
const formatTimestamp = (): string => {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${time}.${ms}`;
};

/**
 * 获取日志级别配置
 */
const getLogLevel = (): string => {
  return process.env.LOG_LEVEL?.toLowerCase() || 'info';
};

/**
 * 检查是否应该输出指定级别的日志
 */
const shouldLog = (level: string): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = getLogLevel();
  const currentIndex = levels.indexOf(currentLevel);
  const targetIndex = levels.indexOf(level);
  return currentIndex <= targetIndex;
};

/**
 * 统一的日志工具
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (!shouldLog('info')) return;
    const timestamp = formatTimestamp();
    console.log(`${colors.gray}${timestamp}${colors.reset} ${colors.blue}[INFO]${colors.reset} ${message}`, ...args);
  },

  error: (message: string, error?: any) => {
    if (!shouldLog('error')) return;
    const timestamp = formatTimestamp();
    console.error(`${colors.gray}${timestamp}${colors.reset} ${colors.red}[ERROR]${colors.reset} ${message}`, error);
  },

  warn: (message: string, ...args: any[]) => {
    if (!shouldLog('warn')) return;
    const timestamp = formatTimestamp();
    console.warn(`${colors.gray}${timestamp}${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (!shouldLog('debug')) return;
    const timestamp = formatTimestamp();
    console.debug(`${colors.gray}${timestamp}${colors.reset} ${colors.cyan}[DEBUG]${colors.reset} ${message}`, ...args);
  },

  success: (message: string, ...args: any[]) => {
    if (!shouldLog('info')) return;
    const timestamp = formatTimestamp();
    console.log(
      `${colors.gray}${timestamp}${colors.reset} ${colors.green}[SUCCESS]${colors.reset} ${message}`,
      ...args
    );
  },
};

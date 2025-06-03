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

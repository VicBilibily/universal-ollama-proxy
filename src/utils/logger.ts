import { existsSync } from 'fs';
import { mkdir, rename, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { getLogTranslation, shouldShowTranslation } from './logTranslations';

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
 * 格式化时间戳（更简洁的格式）- 用于控制台显示
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
 * 格式化完整时间戳（包含日期）- 用于文件日志
 */
const formatFullTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms}`;
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
 * 确保日志目录存在
 */
const ensureLogDir = async (dir: string) => {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('创建日志目录失败:', error);
  }
};

/**
 * 日志文件路径和配置
 */
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_FILE = join(LOG_DIR, 'app.log');

// 日志轮转配置
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE || '10485760'); // 默认 10MB (10 * 1024 * 1024)
const MAX_LOG_FILES = parseInt(process.env.MAX_LOG_FILES || '5'); // 默认保留5个历史文件

/**
 * 检查并轮转日志文件
 */
const rotateLogFile = async (): Promise<void> => {
  try {
    // 检查主日志文件是否存在
    if (!existsSync(LOG_FILE)) {
      return;
    }

    // 获取文件大小
    const fileStats = await stat(LOG_FILE);
    if (fileStats.size < MAX_LOG_SIZE) {
      return; // 文件大小未超限，无需轮转
    }

    // 轮转历史文件 (app.log.1 -> app.log.2, app.log.2 -> app.log.3, ...)
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldFile = `${LOG_FILE}.${i}`;
      const newFile = `${LOG_FILE}.${i + 1}`;

      if (existsSync(oldFile)) {
        if (i === MAX_LOG_FILES - 1) {
          // 删除最老的文件
          await unlink(oldFile);
        } else {
          // 重命名文件
          await rename(oldFile, newFile);
        }
      }
    }

    // 将当前日志文件重命名为 .1
    await rename(LOG_FILE, `${LOG_FILE}.1`);

    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
    console.log(`日志文件已轮转，大小: ${fileSizeMB}MB`);
  } catch (error) {
    console.error('日志文件轮转失败:', error);
  }
};

/**
 * 写入日志文件
 */
const writeToFile = async (level: string, message: string, ...additionalData: any[]) => {
  try {
    await ensureLogDir(LOG_DIR);

    // 检查是否需要轮转日志文件
    await rotateLogFile();

    const fullTimestamp = formatFullTimestamp();
    let fullMessage = `${fullTimestamp} [${level}] ${message}`;

    // 如果有额外的参数，将其序列化并添加到消息中
    if (additionalData.length > 0) {
      const serializedData = additionalData
        .map(data => {
          if (typeof data === 'object') {
            try {
              return JSON.stringify(data, null, 2);
            } catch (e) {
              return String(data);
            }
          }
          return String(data);
        })
        .join(' ');
      fullMessage = `${fullMessage} ${serializedData}`;
    }

    await writeFile(LOG_FILE, `${fullMessage}\n`, { flag: 'a' });
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
};

/**
 * 输出带有英文翻译的日志消息
 */
const logWithTranslation = (level: string, color: string, message: string, timestamp: string, ...args: any[]): void => {
  // 处理额外参数：如果有对象参数，格式化显示
  let additionalInfo = '';
  if (args.length > 0) {
    const formattedArgs = args
      .map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
    additionalInfo = ` ${formattedArgs}`;
  }

  // 输出中文日志（不包含对象信息）
  console.log(`${colors.gray}${timestamp}${colors.reset} ${color}[${level}]${colors.reset} ${message}`);

  // 如果消息包含中文，输出英文翻译
  if (shouldShowTranslation(message)) {
    const translation = getLogTranslation(message);
    if (translation) {
      // 计算对齐空格，使英文翻译与中文消息对齐
      const prefixLength = timestamp.length + level.length + 4; // 时间戳 + [LEVEL] + 空格
      const alignSpaces = ' '.repeat(prefixLength);
      console.log(`${colors.gray}${alignSpaces}${translation}${colors.reset}`);
    }
  }

  // 如果有对象信息，在翻译后显示
  if (additionalInfo) {
    console.log(additionalInfo.trim());
  }
};

/**
 * 统一的日志工具
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (!shouldLog('info')) return;
    const timestamp = formatTimestamp();
    logWithTranslation('INFO', colors.blue, message, timestamp, ...args);
    writeToFile('INFO', message, ...args);
  },

  error: (message: string, ...args: any[]) => {
    if (!shouldLog('error')) return;
    const timestamp = formatTimestamp();
    logWithTranslation('ERROR', colors.red, message, timestamp, ...args);
    writeToFile('ERROR', message, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    if (!shouldLog('warn')) return;
    const timestamp = formatTimestamp();
    logWithTranslation('WARN', colors.yellow, message, timestamp, ...args);
    writeToFile('WARN', message, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (!shouldLog('debug')) return;
    const timestamp = formatTimestamp();
    logWithTranslation('DEBUG', colors.cyan, message, timestamp, ...args);
    writeToFile('DEBUG', message, ...args);
  },

  success: (message: string, ...args: any[]) => {
    if (!shouldLog('info')) return;
    const timestamp = formatTimestamp();
    logWithTranslation('SUCCESS', colors.green, message, timestamp, ...args);
    writeToFile('SUCCESS', message, ...args);
  },

  /**
   * 手动轮转日志文件
   */
  rotate: async (): Promise<void> => {
    await rotateLogFile();
  },

  /**
   * 获取日志配置信息
   */
  getConfig: () => ({
    logDir: LOG_DIR,
    logFile: LOG_FILE,
    maxLogSize: MAX_LOG_SIZE,
    maxLogFiles: MAX_LOG_FILES,
    currentLogLevel: getLogLevel(),
  }),

  /**
   * 获取当前日志文件大小
   */
  getLogFileSize: async (): Promise<number> => {
    try {
      if (!existsSync(LOG_FILE)) {
        return 0;
      }
      const fileStats = await stat(LOG_FILE);
      return fileStats.size;
    } catch (error) {
      console.error('获取日志文件大小失败:', error);
      return 0;
    }
  },

  /**
   * 获取格式化的日志文件大小信息
   */
  getLogFileSizeInfo: async (): Promise<string> => {
    const size = await logger.getLogFileSize();
    const sizeInMB = (size / 1024 / 1024).toFixed(2);
    const maxSizeInMB = (MAX_LOG_SIZE / 1024 / 1024).toFixed(2);
    return `${sizeInMB}MB / ${maxSizeInMB}MB`;
  },
};

/**
 * 导出工具函数供其他模块使用
 */
export { colors, formatFullTimestamp, formatTimestamp, getLogLevel, shouldLog };

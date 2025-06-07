// 统一的脚本日志工具
// 用于所有构建和部署脚本的标准化日志输出

/**
 * 格式化时间戳
 * @param {boolean} useISO - 是否使用ISO格式，默认false使用本地时间格式
 * @returns {string} 格式化的时间戳
 */
function formatTimestamp(useISO = false) {
  if (useISO) {
    return new Date().toISOString();
  }

  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const ensureLogDir = dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error('创建日志目录失败:', error);
  }
};

// 日志文件路径
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_FILE = path.join(LOG_DIR, 'scripts.log');

// 写入日志文件
const writeToFile = (message, ...additionalData) => {
  try {
    ensureLogDir(LOG_DIR);

    let fullMessage = `${message}`;

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

    fs.appendFileSync(LOG_FILE, `${fullMessage}\n`);
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
};

/**
 * 统一的日志记录器
 * 支持多种日志级别和格式化输出
 */
const logger = {
  /**
   * 信息日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   * @param {...any} additionalData - 额外数据
   */
  info: (message, useISO = false, ...additionalData) => {
    const timestamp = formatTimestamp(useISO);
    const logMessage = `${timestamp} [INFO] ${message}`;
    if (useISO) {
      console.log(`${timestamp} [INFO] ${message}`, ...additionalData);
    } else {
      console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[34m[INFO]\x1b[0m ${message}`, ...additionalData);
    }
    writeToFile(logMessage, ...additionalData);
  },

  /**
   * 成功日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   * @param {...any} additionalData - 额外数据
   */
  success: (message, useISO = false, ...additionalData) => {
    const timestamp = formatTimestamp(useISO);
    const logMessage = `${timestamp} [SUCCESS] ${message}`;
    if (useISO) {
      console.log(`${timestamp} [SUCCESS] ✅ ${message}`, ...additionalData);
    } else {
      console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[32m[SUCCESS]\x1b[0m ${message}`, ...additionalData);
    }
    writeToFile(logMessage, ...additionalData);
  },

  /**
   * 错误日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   * @param {...any} additionalData - 额外数据
   */
  error: (message, useISO = false, ...additionalData) => {
    const timestamp = formatTimestamp(useISO);
    const logMessage = `${timestamp} [ERROR] ${message}`;
    if (useISO) {
      console.error(`${timestamp} [ERROR] ❌ ${message}`, ...additionalData);
    } else {
      console.error(`\x1b[90m${timestamp}\x1b[0m \x1b[31m[ERROR]\x1b[0m ${message}`, ...additionalData);
    }
    writeToFile(logMessage, ...additionalData);
  },

  /**
   * 警告日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   * @param {...any} additionalData - 额外数据
   */
  warn: (message, useISO = false, ...additionalData) => {
    const timestamp = formatTimestamp(useISO);
    const logMessage = `${timestamp} [WARN] ${message}`;
    if (useISO) {
      console.warn(`${timestamp} [WARN] ⚠️ ${message}`, ...additionalData);
    } else {
      console.warn(`\x1b[90m${timestamp}\x1b[0m \x1b[33m[WARN]\x1b[0m ${message}`, ...additionalData);
    }
    writeToFile(logMessage, ...additionalData);
  },

  /**
   * 简单的日志函数（兼容性）
   * @param {string} message - 日志消息
   * @param {...any} additionalData - 额外数据
   */
  log: (message, ...additionalData) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage, ...additionalData);
    writeToFile(logMessage, ...additionalData);
  },
};

module.exports = { logger, formatTimestamp };

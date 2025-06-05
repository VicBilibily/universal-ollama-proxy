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

/**
 * 统一的日志记录器
 * 支持多种日志级别和格式化输出
 */
const logger = {
  /**
   * 信息日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   */
  info: (message, useISO = false) => {
    const timestamp = formatTimestamp(useISO);
    if (useISO) {
      console.log(`${timestamp} [INFO] ${message}`);
    } else {
      console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[34m[INFO]\x1b[0m ${message}`);
    }
  },

  /**
   * 成功日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   */
  success: (message, useISO = false) => {
    const timestamp = formatTimestamp(useISO);
    if (useISO) {
      console.log(`${timestamp} [SUCCESS] ✅ ${message}`);
    } else {
      console.log(`\x1b[90m${timestamp}\x1b[0m \x1b[32m[SUCCESS]\x1b[0m ${message}`);
    }
  },

  /**
   * 错误日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   */
  error: (message, useISO = false) => {
    const timestamp = formatTimestamp(useISO);
    if (useISO) {
      console.error(`${timestamp} [ERROR] ❌ ${message}`);
    } else {
      console.error(`\x1b[90m${timestamp}\x1b[0m \x1b[31m[ERROR]\x1b[0m ${message}`);
    }
  },

  /**
   * 警告日志
   * @param {string} message - 日志消息
   * @param {boolean} useISO - 是否使用ISO时间格式
   */
  warn: (message, useISO = false) => {
    const timestamp = formatTimestamp(useISO);
    if (useISO) {
      console.warn(`${timestamp} [WARN] ⚠️ ${message}`);
    } else {
      console.warn(`\x1b[90m${timestamp}\x1b[0m \x1b[33m[WARN]\x1b[0m ${message}`);
    }
  },

  /**
   * 简单的日志函数（兼容性）
   * @param {string} message - 日志消息
   */
  log: message => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  },
};

module.exports = { logger, formatTimestamp };

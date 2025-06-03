// 内网环境连接池优化配置
import http from 'http';
import https from 'https';

/**
 * 内网优化的HTTP/HTTPS Agent配置
 */
export const createOptimizedAgent = (isHttps: boolean = true) => {
  const agentOptions = {
    // 内网环境大幅提升连接池配置
    maxSockets: 200, // 每个主机最大连接数
    maxFreeSockets: 20, // 保持空闲连接数
    timeout: 60000, // 60秒超时
    keepAlive: true,
    keepAliveMsecs: 30000, // 保持连接30秒

    // 内网优化配置
    maxTotalSockets: Infinity, // 不限制总连接数
    scheduling: 'fifo' as const, // 先进先出调度

    // HTTPS优化（仅HTTPS）
    ...(isHttps && {
      rejectUnauthorized: false, // 内网环境允许自签名证书
    }),
  };

  return isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
};

/**
 * 全局HTTP Agent实例
 */
export const httpAgent = createOptimizedAgent(false);
export const httpsAgent = createOptimizedAgent(true);

/**
 * 获取适用于fetch的Agent配置
 */
export const getFetchAgentConfig = () => ({
  httpAgent,
  httpsAgent,
});

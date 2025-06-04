// 聊天请求详细日志记录工具
import { mkdir, writeFile } from 'fs/promises';
import { OpenAI } from 'openai';
import { join } from 'path';
import { logger } from '.';
import { ModelConfig } from '../types';

/**
 * 聊天日志记录配置
 */
interface ChatLogConfig {
  enabled: boolean;
  logDir: string;
}

/**
 * 聊天请求日志数据
 */
interface ChatRequestLog {
  requestId: string;
  timestamp: string;
  model: string;
  provider: string;
  openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams; // 转换后的 OpenAI 请求
  response?: {
    id?: string;
    choices?: any[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    responseTime: number;
    isStream: boolean;
    streamChunks?: any[]; // 存储所有流式响应块
    streamChunkCount?: number;
    error?: any;
  };
  metadata: {
    startTime: string;
    endTime?: string;
    clientInfo?: {
      userAgent?: string;
      ip?: string;
    };
  };
  summary?: {
    totalResponseTime: number;
    streamChunkCount: number;
    hasError: boolean;
    tokenUsage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      [key: string]: any;
    };
    requestSize: number;
    responseSize?: number;
  };
}

/**
 * 聊天详细日志记录器
 * 每个请求单独存储到一个文件中，记录完整的通讯内容
 */
class ChatLogger {
  private config: ChatLogConfig;
  private activeRequests: Map<string, ChatRequestLog> = new Map();

  constructor() {
    // 默认配置
    this.config = {
      enabled: false,
      logDir: 'logs/chat',
    };

    // 从环境变量加载配置
    this.loadConfig();
  }

  /**
   * 从环境变量加载配置
   */
  private loadConfig(): void {
    // 是否启用日志
    this.config.enabled = process.env.CHAT_LOGS === 'true';

    // 日志目录
    if (process.env.CHAT_LOGS_DIR) {
      this.config.logDir = process.env.CHAT_LOGS_DIR;
    }

    // 如果启用日志，确保日志目录存在
    if (this.config.enabled) {
      this.ensureLogDir();
    }
  }

  /**
   * 确保日志目录存在
   */
  private async ensureLogDir(): Promise<void> {
    try {
      await mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      console.error('创建聊天日志目录失败:', error);
    }
  }

  /**
   * 生成唯一的请求ID
   * 格式: 纯数字日期时间 + 随机ID
   * 例如: 20250604103015123_abc123def
   */
  generateRequestId(): string {
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      now.getMilliseconds().toString().padStart(3, '0');

    const randomId = Math.random().toString(36).substring(2, 11);
    return `${timestamp}_${randomId}`;
  }

  /**
   * 检查日志记录是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 记录聊天请求开始
   */
  async logRequestStart(
    requestId: string,
    openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig,
    clientInfo?: { userAgent?: string; ip?: string }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const startTime = new Date().toISOString();

    const logEntry: ChatRequestLog = {
      requestId,
      timestamp: startTime,
      model: openaiRequest.model, // 使用 OpenAI 请求中的模型名称
      provider: modelConfig.provider || 'unknown',
      openaiRequest: JSON.parse(JSON.stringify(openaiRequest)), // 深拷贝 OpenAI 请求
      metadata: {
        startTime,
        clientInfo,
      },
    };

    // 存储到活跃请求映射中
    this.activeRequests.set(requestId, logEntry);
  }

  /**
   * 记录流式响应块
   */
  async logStreamChunk(requestId: string, chunk: OpenAI.Chat.Completions.ChatCompletionChunk): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry = this.activeRequests.get(requestId);
    if (!logEntry) return;

    // 初始化流式响应数据
    if (!logEntry.response) {
      logEntry.response = {
        isStream: true,
        streamChunks: [],
        streamChunkCount: 0,
        responseTime: 0,
      };
    }

    // 添加流式响应块
    if (!logEntry.response.streamChunks) {
      logEntry.response.streamChunks = [];
    }

    logEntry.response.streamChunks.push({
      timestamp: new Date().toISOString(),
      chunk: JSON.parse(JSON.stringify(chunk)), // 深拷贝流式响应块
    });

    logEntry.response.streamChunkCount = (logEntry.response.streamChunkCount || 0) + 1;
  }

  /**
   * 记录聊天响应完成
   */
  async logRequestComplete(
    requestId: string,
    response: OpenAI.Chat.Completions.ChatCompletion | null,
    responseTime: number,
    isStream: boolean,
    streamChunkCount?: number,
    error?: any
  ): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry = this.activeRequests.get(requestId);
    if (!logEntry) return;

    const endTime = new Date().toISOString();

    // 更新响应信息
    if (!logEntry.response) {
      logEntry.response = {
        isStream,
        responseTime,
        streamChunkCount: streamChunkCount || 0,
      };
    } else {
      logEntry.response.responseTime = responseTime;
    }

    // 添加响应数据
    if (response) {
      logEntry.response.id = response.id;
      logEntry.response.choices = JSON.parse(JSON.stringify(response.choices)); // 深拷贝响应选择
      logEntry.response.usage = response.usage;
    }

    // 添加错误信息
    if (error) {
      logEntry.response.error = {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.status,
        stack: error.stack,
        details: error.toString(),
      };
    }

    // 更新元数据
    logEntry.metadata.endTime = endTime;

    // 生成汇总信息
    const requestSize = JSON.stringify(logEntry.openaiRequest).length; // 使用 openaiRequest 计算大小
    const responseSize = response ? JSON.stringify(response).length : 0;

    logEntry.summary = {
      totalResponseTime: responseTime,
      streamChunkCount: streamChunkCount || 0,
      hasError: !!error,
      tokenUsage: response?.usage || undefined,
      requestSize,
      responseSize,
    };

    // 写入单个完整日志文件
    await this.writeCompleteLog(logEntry);

    // 从活跃请求中移除
    this.activeRequests.delete(requestId);
  }

  /**
   * 写入完整日志文件
   */
  private async writeCompleteLog(logEntry: ChatRequestLog): Promise<void> {
    try {
      const logFileName = `${logEntry.requestId}.json`;
      const logFilePath = join(this.config.logDir, logFileName);

      // 构造完整的日志对象，突出显示 provider 和 openaiRequest
      const completeLog = {
        phase: 'COMPLETE',
        requestId: logEntry.requestId,
        timestamp: logEntry.timestamp,
        provider: logEntry.provider, // 突出显示 provider
        model: logEntry.model,
        openaiRequest: logEntry.openaiRequest, // 突出显示转换后的 OpenAI 请求
        response: logEntry.response,
        metadata: logEntry.metadata,
        summary: logEntry.summary,
      };

      await writeFile(logFilePath, JSON.stringify(completeLog, null, 2), 'utf8');
    } catch (error) {
      console.error('写入聊天日志失败:', error);
    }
  }

  /**
   * 清理超时的请求
   */
  cleanupStaleRequests(timeoutMs: number = 300000): void {
    // 5分钟超时
    const now = Date.now();
    const staleRequests: string[] = [];

    for (const [requestId, logEntry] of this.activeRequests.entries()) {
      const requestTime = new Date(logEntry.timestamp).getTime();
      if (now - requestTime > timeoutMs) {
        staleRequests.push(requestId);
      }
    }

    // 清理超时请求
    for (const requestId of staleRequests) {
      const logEntry = this.activeRequests.get(requestId);
      if (logEntry) {
        // 标记为超时并写入日志
        this.logRequestComplete(
          requestId,
          null,
          now - new Date(logEntry.timestamp).getTime(),
          logEntry.openaiRequest?.stream || false,
          logEntry.response?.streamChunkCount,
          { message: '请求超时', code: 'TIMEOUT' }
        );
      }
    }
  }

  /**
   * 获取配置信息
   */
  getConfig(): ChatLogConfig {
    return { ...this.config };
  }

  /**
   * 重新加载配置
   */
  reloadConfig(): void {
    this.loadConfig();
    logger.info('聊天日志配置已重新加载', {
      enabled: this.config.enabled,
      logDir: this.config.logDir,
    });
  }

  /**
   * 获取活跃请求数量
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }
}

// 导出单例实例
export const chatLogger = new ChatLogger();

// 定期清理超时请求
if (chatLogger.isEnabled()) {
  setInterval(() => {
    chatLogger.cleanupStaleRequests();
  }, 60000); // 每分钟检查一次
}

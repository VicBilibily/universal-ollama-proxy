// 聊天请求详细日志记录工具
import { mkdir, writeFile } from 'fs/promises';
import { OpenAI } from 'openai';
import { join } from 'path';
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
  request: {
    model: string;
    messages: any[];
    stream: boolean;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
    [key: string]: any;
  };
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
}

/**
 * 聊天详细日志记录器
 * 每个请求单独存储到一个文件中，记录完整的通讯内容
 */
class ChatLogger {
  private config: ChatLogConfig;
  private activeRequests: Map<string, ChatRequestLog> = new Map();

  constructor() {
    this.config = {
      enabled: process.env.CHAT_LOGS === 'true',
      logDir: process.env.CHAT_LOGS_DIR || 'logs/chat',
    };

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
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${random}`;
  }

  /**
   * 记录聊天请求开始
   */
  async logRequestStart(
    requestId: string,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    modelConfig: ModelConfig,
    clientInfo?: { userAgent?: string; ip?: string }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const startTime = new Date().toISOString();

    const logEntry: ChatRequestLog = {
      requestId,
      timestamp: startTime,
      model: request.model,
      provider: modelConfig.provider || 'unknown',
      request: {
        model: request.model,
        messages: request.messages as any[], // 保存完整消息内容
        stream: request.stream || false,
        temperature: request.temperature || undefined,
        max_tokens: request.max_tokens || undefined,
        top_p: request.top_p || undefined,
        frequency_penalty: request.frequency_penalty || undefined,
        presence_penalty: request.presence_penalty || undefined,
        stop: request.stop || undefined,
        // 保存其他所有参数
        ...Object.fromEntries(
          Object.entries(request).filter(
            ([key]) =>
              ![
                'model',
                'messages',
                'stream',
                'temperature',
                'max_tokens',
                'top_p',
                'frequency_penalty',
                'presence_penalty',
                'stop',
              ].includes(key)
          )
        ),
      },
      metadata: {
        startTime,
        clientInfo,
      },
    };

    // 存储到活跃请求映射中
    this.activeRequests.set(requestId, logEntry);

    // 立即写入请求开始日志
    await this.writeRequestStartLog(logEntry);
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
      chunk: chunk, // 保存完整的流式响应块
    });

    logEntry.response.streamChunkCount = (logEntry.response.streamChunkCount || 0) + 1;

    // 定期写入流式数据（每10个块或遇到结束块时）
    const shouldWrite = logEntry.response.streamChunkCount % 10 === 0 || chunk.choices?.[0]?.finish_reason === 'stop';

    if (shouldWrite) {
      await this.writeStreamUpdate(logEntry);
    }
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
      logEntry.response.choices = response.choices; // 保存完整的选择内容
      logEntry.response.usage = response.usage;
    }

    // 添加错误信息
    if (error) {
      logEntry.response.error = {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.status,
        stack: error.stack, // 保存完整的错误堆栈
        details: error.toString(),
      };
    }

    // 更新元数据
    logEntry.metadata.endTime = endTime;

    // 写入最终的完整日志
    await this.writeRequestCompleteLog(logEntry);

    // 从活跃请求中移除
    this.activeRequests.delete(requestId);
  }

  /**
   * 写入请求开始日志
   */
  private async writeRequestStartLog(logEntry: ChatRequestLog): Promise<void> {
    try {
      const logFileName = `${logEntry.requestId}_request.json`;
      const logFilePath = join(this.config.logDir, logFileName);

      const logData = {
        phase: 'REQUEST_START',
        ...logEntry,
      };

      await writeFile(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
    } catch (error) {
      console.error('写入请求开始日志失败:', error);
    }
  }

  /**
   * 写入流式更新日志
   */
  private async writeStreamUpdate(logEntry: ChatRequestLog): Promise<void> {
    try {
      const logFileName = `${logEntry.requestId}_stream.json`;
      const logFilePath = join(this.config.logDir, logFileName);

      const logData = {
        phase: 'STREAM_UPDATE',
        ...logEntry,
      };

      await writeFile(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
    } catch (error) {
      console.error('写入流式更新日志失败:', error);
    }
  }

  /**
   * 写入请求完成日志
   */
  private async writeRequestCompleteLog(logEntry: ChatRequestLog): Promise<void> {
    try {
      const logFileName = `${logEntry.requestId}_complete.json`;
      const logFilePath = join(this.config.logDir, logFileName);

      const logData = {
        phase: 'REQUEST_COMPLETE',
        ...logEntry,
        summary: {
          totalResponseTime: logEntry.response?.responseTime,
          streamChunkCount: logEntry.response?.streamChunkCount,
          hasError: !!logEntry.response?.error,
          tokenUsage: logEntry.response?.usage,
          requestSize: JSON.stringify(logEntry.request).length,
          responseSize: logEntry.response ? JSON.stringify(logEntry.response).length : 0,
        },
      };

      await writeFile(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
    } catch (error) {
      console.error('写入请求完成日志失败:', error);
    }
  }

  /**
   * 检查是否启用详细日志
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 获取配置信息
   */
  getConfig(): ChatLogConfig {
    return { ...this.config };
  }

  /**
   * 获取活跃请求数量
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * 清理超时的活跃请求
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
          logEntry.request.stream,
          logEntry.response?.streamChunkCount,
          { message: '请求超时', code: 'TIMEOUT' }
        );
      }
    }
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

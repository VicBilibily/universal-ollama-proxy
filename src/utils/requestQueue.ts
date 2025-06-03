// 内网优化的请求队列管理
import { logger } from './index';

interface QueueItem {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  timeout?: number;
}

export class RequestQueue {
  private queue: QueueItem[] = [];
  private running = 0;
  private readonly maxConcurrent: number;
  private readonly queueLimit: number;
  private stats = {
    total: 0,
    completed: 0,
    failed: 0,
    timeout: 0,
    queued: 0,
  };

  constructor(maxConcurrent: number = 50, queueLimit: number = 500) {
    // 内网环境提升默认限制
    this.maxConcurrent = maxConcurrent;
    this.queueLimit = queueLimit;
  }

  async add<T>(fn: () => Promise<T>, options?: { timeout?: number; priority?: number }): Promise<T> {
    // 内网环境下放宽队列限制
    if (this.queue.length >= this.queueLimit) {
      logger.warn(`请求队列已满: ${this.queue.length}/${this.queueLimit}，请求可能被延迟`);
      // 不直接拒绝，而是继续排队（内网环境相对可控）
    }

    return new Promise<T>((resolve, reject) => {
      const id = this.generateId();
      const item: QueueItem = {
        id,
        fn,
        resolve,
        reject,
        timestamp: Date.now(),
        timeout: options?.timeout,
      };

      // 根据优先级插入队列
      if (options?.priority && options.priority > 0) {
        this.queue.unshift(item);
      } else {
        this.queue.push(item);
      }

      this.stats.total++;
      this.stats.queued = this.queue.length;

      logger.debug(`请求 ${id} 加入队列，当前队列长度: ${this.queue.length}`);
      this.process();
    });
  }

  private async process(): Promise<void> {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.running++;
      this.stats.queued = this.queue.length;

      this.executeItem(item).finally(() => {
        this.running--;
        this.process(); // 继续处理队列
      });
    }
  }

  private async executeItem(item: QueueItem): Promise<void> {
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // 设置超时
      if (item.timeout) {
        timeoutId = setTimeout(() => {
          this.stats.timeout++;
          item.reject(new Error(`请求 ${item.id} 超时 (${item.timeout}ms)`));
        }, item.timeout);
      }

      logger.debug(`开始执行请求 ${item.id}，等待时间: ${startTime - item.timestamp}ms`);

      const result = await item.fn();

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      this.stats.completed++;
      const duration = Date.now() - startTime;
      logger.debug(`请求 ${item.id} 完成，执行时间: ${duration}ms`);

      item.resolve(result);
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      this.stats.failed++;
      logger.error(`请求 ${item.id} 失败:`, error);
      item.reject(error);
    }
  }

  getStats() {
    return {
      ...this.stats,
      running: this.running,
      queued: this.queue.length,
    };
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 全局请求队列实例（内网优化配置）
export const requestQueue = new RequestQueue(100, 1000); // 提升并发和队列限制

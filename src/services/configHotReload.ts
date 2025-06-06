import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils';
import { parseConfigFile } from '../utils/jsonParser';

export interface ConfigChangeEvent {
  type: 'config';
  filePath: string;
  timestamp: Date;
}

export interface ConfigDeleteEvent {
  type: 'delete';
  filePath: string;
  timestamp: Date;
}

export class ConfigHotReload extends EventEmitter {
  private watchers: chokidar.FSWatcher[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly debounceDelay = 1000; // 1秒防抖
  private isEnabled = false;

  constructor() {
    super();
    this.setupWatchers();
  }

  /**
   * 启用配置热重载
   */
  public enable(): void {
    if (this.isEnabled) {
      return;
    }

    this.isEnabled = true;
    this.setupWatchers();
    logger.info('配置热重载已启用（仅支持JSON配置文件）');
    this.emit('enabled');
  }

  /**
   * 禁用配置热重载
   */
  public disable(): void {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;
    this.stopWatching();
    logger.info('配置热重载已禁用');
    this.emit('disabled');
  }

  /**
   * 设置文件监听器
   */
  private setupWatchers(): void {
    if (!this.isEnabled) {
      return;
    }

    const rootDir = process.cwd();

    // 只监听 config 目录中的JSON文件
    const configDir = path.join(rootDir, 'config');
    if (fs.existsSync(configDir)) {
      this.watchDirectory(configDir);
    }

    logger.info('配置文件监听器已设置（仅监听JSON配置文件）');
  }

  /**
   * 监听目录
   */
  private watchDirectory(dirPath: string): void {
    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true,
      depth: 2, // 最多监听2层目录
    });

    watcher.on('change', changedPath => {
      // 只处理 JSON 配置文件
      if (path.extname(changedPath) === '.json') {
        this.handleFileChange(changedPath);
      }
    });

    watcher.on('add', changedPath => {
      if (path.extname(changedPath) === '.json') {
        this.handleFileChange(changedPath);
      }
    });

    watcher.on('unlink', changedPath => {
      if (path.extname(changedPath) === '.json') {
        this.handleFileDelete(changedPath);
      }
    });

    watcher.on('error', error => {
      logger.error(`目录监听错误 ${dirPath}:`, error);
    });

    this.watchers.push(watcher);
    logger.debug(`开始监听目录: ${dirPath}`);
  }

  /**
   * 处理文件变化（带防抖）
   */
  private handleFileChange(filePath: string): void {
    logger.debug(`配置文件变化事件触发: ${filePath}`);

    const fileKey = `config:${filePath}`;

    // 清除之前的定时器
    if (this.debounceTimers.has(fileKey)) {
      clearTimeout(this.debounceTimers.get(fileKey)!);
      logger.debug(`清除之前的防抖定时器: ${fileKey}`);
    }

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      logger.debug(`防抖定时器触发，开始处理配置变化: ${fileKey}`);
      this.processConfigChange(filePath);
      this.debounceTimers.delete(fileKey);
    }, this.debounceDelay);

    this.debounceTimers.set(fileKey, timer);
    logger.debug(`设置防抖定时器: ${fileKey}, 延迟: ${this.debounceDelay}ms`);
  }

  /**
   * 处理文件删除
   */
  private handleFileDelete(filePath: string): void {
    logger.debug(`检测到配置文件删除: ${filePath}`);

    const fileKey = `config:${filePath}`;

    // 清除之前的定时器
    if (this.debounceTimers.has(fileKey)) {
      clearTimeout(this.debounceTimers.get(fileKey)!);
      this.debounceTimers.delete(fileKey);
      logger.debug(`清除删除文件的防抖定时器: ${fileKey}`);
    }

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      logger.info(`配置文件已删除: ${filePath}`);

      const event: ConfigDeleteEvent = {
        type: 'delete',
        filePath,
        timestamp: new Date(),
      };

      this.emit('configDeleted', event);
    }, this.debounceDelay);

    this.debounceTimers.set(fileKey, timer);
  }

  /**
   * 处理配置变化
   */
  private async processConfigChange(filePath: string): Promise<void> {
    try {
      logger.info(`检测到JSON配置文件变化: ${filePath}`);

      const reloadSuccess = await this.reloadJsonConfig(filePath);

      if (reloadSuccess) {
        const event: ConfigChangeEvent = {
          type: 'config',
          filePath,
          timestamp: new Date(),
        };

        this.emit('configChanged', event);
        logger.info(`配置重载成功: ${filePath}`);
      }
    } catch (error) {
      logger.error(`配置重载失败 ${filePath}:`, error);
      this.emit('error', error);
    }
  }

  /**
   * 重载 JSON 配置文件
   */
  private async reloadJsonConfig(filePath: string): Promise<boolean> {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        // 文件不存在，可能已经被删除
        logger.debug(`配置文件不存在，可能已被删除: ${path.basename(filePath)}`);
        return false;
      }

      // 重新读取配置文件
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const configData = parseConfigFile(fileContent, filePath);

      logger.debug(`JSON 配置文件已重新加载: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      logger.error('重载 JSON 配置文件失败:', error);
      return false;
    }
  }

  /**
   * 停止所有文件监听
   */
  private stopWatching(): void {
    this.watchers.forEach(watcher => {
      watcher.close();
    });
    this.watchers = [];

    // 清理防抖定时器
    this.debounceTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();

    logger.debug('所有文件监听器已停止');
  }

  /**
   * 手动触发配置重载
   */
  public async manualReload(): Promise<void> {
    try {
      const rootDir = process.cwd();

      // 重载所有 JSON 配置文件
      const configDir = path.join(rootDir, 'config');
      if (fs.existsSync(configDir)) {
        const configFiles = fs
          .readdirSync(configDir)
          .filter(file => path.extname(file) === '.json')
          .map(file => path.join(configDir, file));

        for (const configFile of configFiles) {
          await this.reloadJsonConfig(configFile);
        }
      }

      this.emit('manualReload', new Date());
      logger.info('手动配置重载完成');
    } catch (error) {
      logger.error('手动配置重载失败:', error);
      this.emit('error', error);
    }
  }

  /**
   * 获取当前监听状态
   */
  public getStatus(): { enabled: boolean; watchedFiles: number } {
    return {
      enabled: this.isEnabled,
      watchedFiles: this.watchers.length,
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.disable();
    this.removeAllListeners();
    logger.debug('配置热重载服务已销毁');
  }
}

// 导出单例实例
export const configHotReload = new ConfigHotReload();

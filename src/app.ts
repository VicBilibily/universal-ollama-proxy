import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs/promises';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config, configManager, validateConfig } from './config';
import { OllamaController } from './controllers/ollama';
import { OpenAIController } from './controllers/openai';
import { errorHandler, requestLogger, setupStreamResponse, validateRequestSize } from './middleware';
import { configHotReload } from './services/configHotReload';
import { ModelDiscoveryService } from './services/modelDiscovery';
import { OllamaService } from './services/ollama';
import { OpenAICompatService } from './services/openai';
import { UnifiedAdapterService } from './services/unified-adapter';
import { UnifiedAdapterConfig } from './types';
import { logger } from './utils';
import { chatLogger } from './utils/chatLogger';
import { parseConfigFile } from './utils/jsonParser';

// 加载环境变量
dotenv.config();

class App {
  public app: express.Application;
  private modelDiscoveryService!: ModelDiscoveryService;
  private unifiedAdapterService!: UnifiedAdapterService;
  private ollamaService!: OllamaService;
  private openaiService!: OpenAICompatService;
  private ollamaController!: OllamaController;
  private openaiController!: OpenAIController;
  constructor() {
    this.app = express();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.initializeServices();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }
  private async initializeServices(): Promise<void> {
    try {
      // 验证配置
      validateConfig();

      // 初始化配置热重载服务
      this.initializeConfigHotReload();

      // 加载统一适配器配置
      const unifiedConfigPath = path.join(process.cwd(), 'config', 'unified-providers.json');
      const unifiedConfigData = await fs.readFile(unifiedConfigPath, 'utf-8');
      const unifiedConfig: UnifiedAdapterConfig = parseConfigFile(unifiedConfigData, unifiedConfigPath);

      // 替换环境变量
      for (const provider of unifiedConfig.providers) {
        if (provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
          const envVar = provider.apiKey.slice(2, -1);
          provider.apiKey = process.env[envVar] || '';

          if (!provider.apiKey) {
            logger.warn(`环境变量 ${envVar} 未设置，${provider.displayName} 提供商将不可用`);
          }
        }
      }

      // 初始化日志配置
      chatLogger.reloadConfig();
      logger.info('聊天日志已初始化', {
        enabled: chatLogger.isEnabled(),
        config: chatLogger.getConfig(),
      });

      // 初始化模型发现服务（统一实现，不依赖特定服务）
      this.modelDiscoveryService = new ModelDiscoveryService();

      // 初始化统一适配器
      this.unifiedAdapterService = new UnifiedAdapterService(this.modelDiscoveryService, unifiedConfig);

      // 初始化Ollama服务（直接使用ModelDiscoveryService）
      this.ollamaService = new OllamaService(this.modelDiscoveryService);

      // 初始化OpenAI兼容服务（通过统一适配器）
      this.openaiService = new OpenAICompatService(this.unifiedAdapterService);

      // 初始化控制器
      this.ollamaController = new OllamaController(this.ollamaService);
      this.openaiController = new OpenAIController(this.openaiService);

      logger.info('统一适配器服务初始化完成');
    } catch (error) {
      logger.error('服务初始化失败:', error);
      process.exit(1);
    }
  }

  private initializeConfigHotReload(): void {
    // 启用配置热重载
    configHotReload.enable();

    // 监听配置变化事件
    configHotReload.on('configChanged', event => {
      logger.info(`配置文件已更新: ${event.filePath}`, { type: event.type, timestamp: event.timestamp });

      // 根据配置类型执行相应的重载逻辑
      if (event.type === 'config') {
        this.handleJsonConfigChange(event.filePath);
      }
    });

    // 监听配置管理器的配置更新事件
    configManager.on('configUpdated', ({ key, oldValue, newValue }) => {
      logger.info(`配置项已更新: ${key}`, { oldValue, newValue });
      this.handleConfigUpdate(key, oldValue, newValue);
    });

    // 监听配置重载事件
    configManager.on('configReloaded', () => {
      logger.info('所有配置已重新加载');
    });

    // 监听热重载错误
    configHotReload.on('error', error => {
      logger.error('配置热重载错误:', error);
    });

    logger.info('配置热重载服务已初始化（仅支持JSON配置文件）');
  }

  private handleJsonConfigChange(filePath: string): void {
    try {
      const fileName = path.basename(filePath, '.json');
      logger.info(`处理JSON配置文件变化: ${fileName}`);

      // 根据配置文件类型执行相应的处理逻辑
      switch (fileName) {
        case 'unified-providers':
          this.handleUnifiedProvidersConfigChange();
          break;
        case 'message-processing-rules':
          this.handleMessageProcessingRulesChange();
          break;
        default:
          // 检查是否是模型配置文件 (provider-models.json 格式)
          if (fileName.endsWith('-models')) {
            const providerName = fileName.replace('-models', '');
            this.handleProviderModelsConfigChange(providerName);
          } else {
            logger.debug(`未知的配置文件类型: ${fileName}`);
          }
      }
    } catch (error) {
      logger.error('处理JSON配置文件变化失败:', error);
    }
  }

  private handleConfigUpdate(key: string, oldValue: any, newValue: any): void {
    try {
      // 处理特定配置项的更新
      switch (key) {
        case 'port':
          logger.warn('端口配置已更改，需要重启服务才能生效', { oldPort: oldValue, newPort: newValue });
          break;
        default:
          logger.debug(`配置项 ${key} 已更新`, { oldValue, newValue });
      }
    } catch (error) {
      logger.error('处理配置更新失败:', error);
    }
  }

  private async handleUnifiedProvidersConfigChange(): Promise<void> {
    try {
      logger.info('统一提供商配置已更改，重新初始化相关服务');

      // 重新加载统一提供商配置
      const unifiedConfigPath = path.join(process.cwd(), 'config', 'unified-providers.json');
      const unifiedConfigData = await fs.readFile(unifiedConfigPath, 'utf-8');
      const unifiedConfig: UnifiedAdapterConfig = parseConfigFile(unifiedConfigData, unifiedConfigPath);

      // 替换环境变量
      for (const provider of unifiedConfig.providers) {
        if (provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
          const envVar = provider.apiKey.slice(2, -1);
          provider.apiKey = process.env[envVar] || '';

          if (!provider.apiKey) {
            logger.warn(`环境变量 ${envVar} 未设置，${provider.displayName} 提供商将不可用`);
          }
        }
      }

      // 获取新配置中的供应商列表
      const availableProviders = unifiedConfig.providers.map(provider => provider.name);

      // 先更新模型发现服务，同步供应商配置（这会移除不存在的供应商的模型）
      if (this.modelDiscoveryService) {
        await this.modelDiscoveryService.syncWithProviderConfig(availableProviders);
        logger.info('模型发现服务已与供应商配置同步');
      }

      // 再更新统一适配器服务配置
      if (this.unifiedAdapterService) {
        this.unifiedAdapterService.updateConfig(unifiedConfig);
        logger.info('统一适配器服务配置已更新');
      }

      // 记录最终状态
      const modelStats = this.modelDiscoveryService?.getModelStats();
      const activeProviders = this.unifiedAdapterService?.getActiveProviders();

      logger.info('统一提供商配置变化处理完成', {
        configProviders: availableProviders.length,
        activeProviders: activeProviders?.length || 0,
        totalModels: modelStats?.totalModels || 0,
        modelProviders: modelStats?.providerCount || 0,
      });
    } catch (error) {
      logger.error('处理统一提供商配置变化失败:', error);
    }
  }

  private handleMessageProcessingRulesChange(): void {
    try {
      logger.info('消息处理规则配置已更改，重新加载日志配置');

      // 重新加载聊天日志配置
      if (chatLogger && typeof chatLogger.reloadConfig === 'function') {
        chatLogger.reloadConfig();
        logger.info('聊天日志配置已重新加载', {
          enabled: chatLogger.isEnabled(),
          config: chatLogger.getConfig(),
        });
      }
    } catch (error) {
      logger.error('处理消息处理规则变化失败:', error);
    }
  }

  private async handleProviderModelsConfigChange(providerName: string): Promise<void> {
    try {
      logger.info(`${providerName} 提供商模型配置已更改，重新加载模型配置`);

      // 重新加载该提供商的模型配置
      if (this.modelDiscoveryService) {
        await this.modelDiscoveryService.refreshProviderModels(providerName);

        const stats = this.modelDiscoveryService.getModelStats();
        logger.info(`${providerName} 提供商模型配置重新加载完成`, stats);
      }
    } catch (error) {
      logger.error(`处理 ${providerName} 提供商模型配置变化失败:`, error);
    }
  }

  private initializeMiddlewares(): void {
    // 安全中间件配置
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
      })
    );

    // CORS 配置 - 允许所有来源访问
    this.app.use(
      cors({
        origin: true, // 允许所有来源
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'User-Agent',
          'Accept',
          'X-Requested-With',
          'Cache-Control',
          'Pragma',
        ],
        credentials: false, // API服务不需要credentials
      })
    );

    // 标准请求体限制（需要在开发日志中间件之前）
    this.app.use(
      express.json({
        limit: '100mb', // 合理的JSON请求限制
        strict: true, // 严格JSON解析
      })
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '100mb',
        parameterLimit: 1000, // 合理的参数数量限制
      })
    );

    // 请求日志 - 统一格式
    const morganFormat =
      process.env.NODE_ENV === 'production'
        ? ':remote-addr :method :url :status :response-time ms - :res[content-length]'
        : ':method :url :status :response-time ms';

    this.app.use(
      morgan(morganFormat, {
        // 自定义颜色输出
        stream: {
          write: (message: string) => {
            const msg = message.trim();
            // 根据状态码着色
            if (msg.includes(' 2')) {
              console.log(
                `\x1b[90m${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}\x1b[0m \x1b[32m[HTTP]\x1b[0m ${msg}`
              );
            } else if (msg.includes(' 4') || msg.includes(' 5')) {
              console.log(
                `\x1b[90m${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}\x1b[0m \x1b[31m[HTTP]\x1b[0m ${msg}`
              );
            } else {
              console.log(
                `\x1b[90m${new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}\x1b[0m \x1b[36m[HTTP]\x1b[0m ${msg}`
              );
            }
          },
        },
      })
    );
    this.app.use(requestLogger);

    // 自定义中间件
    this.app.use(validateRequestSize);
    this.app.use(setupStreamResponse);
  }
  private initializeRoutes(): void {
    // 健康检查端点
    this.app.get('/', this.ollamaController.healthCheck.bind(this.ollamaController));

    // API 版本信息
    this.app.get('/api/version', this.ollamaController.version.bind(this.ollamaController));

    // OpenAI 兼容接口
    this.app.post('/v1/chat/completions', this.openaiController.chatCompletions.bind(this.openaiController));

    // Ollama API 端点
    this.app.get('/api/tags', this.ollamaController.getTags.bind(this.ollamaController));
    this.app.post('/api/show', this.ollamaController.show.bind(this.ollamaController));

    // 404 处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          message: '接口不存在',
          code: 'NOT_FOUND',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(config.port, async () => {
      logger.success(`🚀 Ollama 兼容服务器启动成功，监听端口 ${config.port}`);
      logger.info(`🔍 健康检查: http://localhost:${config.port}/`);

      try {
        const supportedModels = await this.modelDiscoveryService.getAvailableModels();
        const modelCount = supportedModels.length;
        logger.info(`🤖 已加载 ${modelCount} 个模型:`);

        // 分批显示模型，避免单行过长
        const modelsPerLine = 3;
        for (let i = 0; i < supportedModels.length; i += modelsPerLine) {
          const modelBatch = supportedModels.slice(i, i + modelsPerLine);
          logger.info(`   ${modelBatch.join(', ')}`);
        }
      } catch (error) {
        logger.warn('无法获取模型列表:', error);
      }
    });
  }

  /**
   * 清理应用资源
   */
  public cleanup(): void {
    try {
      logger.info('开始清理应用资源');

      // 停止配置热重载服务
      if (configHotReload) {
        configHotReload.destroy();
        logger.info('配置热重载服务已停止');
      }

      logger.info('应用资源清理完成');
    } catch (error) {
      logger.error('清理应用资源失败:', error);
    }
  }

  /**
   * 优雅关闭应用
   */
  public async gracefulShutdown(): Promise<void> {
    try {
      logger.info('开始优雅关闭应用');

      // 清理资源
      this.cleanup();

      logger.info('应用已优雅关闭');
    } catch (error) {
      logger.error('优雅关闭应用失败:', error);
    }
  }
}

export default App;

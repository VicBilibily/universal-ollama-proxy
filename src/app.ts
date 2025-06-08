import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import * as fsPromises from 'fs/promises';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config, validateConfig } from './config';
import { OllamaController } from './controllers/ollama';
import { OpenAIController } from './controllers/openai';
import { errorHandler, requestLogger, setupStreamResponse, validateRequestSize } from './middleware';
import { configReloader } from './services/configReloader';
import { ModelDiscoveryService } from './services/modelDiscovery';
import { OllamaService } from './services/ollama';
import { OpenAICompatService } from './services/openai';
import { UnifiedAdapterService } from './services/unifiedAdapter';
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
      const unifiedConfigData = await fsPromises.readFile(unifiedConfigPath, 'utf-8');
      const unifiedConfig: UnifiedAdapterConfig = parseConfigFile(unifiedConfigData, unifiedConfigPath);

      // 替换环境变量并过滤可用的提供商
      const validProviders: UnifiedAdapterConfig['providers'] = [];

      for (const provider of unifiedConfig.providers) {
        let isProviderAvailable = false;

        // 情况1: 以${开头，表示从环境变量获取
        if (provider.apiKey && provider.apiKey.startsWith('${') && provider.apiKey.endsWith('}')) {
          const envVar = provider.apiKey.slice(2, -1);
          const envValue = process.env[envVar];

          if (envValue && envValue.trim() !== '') {
            provider.apiKey = envValue;
            isProviderAvailable = true;
            const displayName = provider.displayName;
            logger.info(`从环境变量 ${envVar} 获取 ${displayName} 提供商的 API Key`);
          } else {
            const displayName = provider.displayName;
            logger.warn(`环境变量 ${envVar} 未设置，${displayName} 提供商将不可用`);
            isProviderAvailable = false;
          }
        }
        // 情况2: 不以${开头且非空，表示配置中已有配置密钥
        else if (provider.apiKey && provider.apiKey.trim() !== '') {
          const displayName = provider.displayName;
          logger.info(`使用配置文件中的配置密钥配置 ${displayName} 提供商`);
          isProviderAvailable = true;
        }
        // 情况3: 为空，表示此供应商不需要认证
        else if (!provider.apiKey || provider.apiKey.trim() === '') {
          const displayName = provider.displayName;
          logger.info(`${displayName} 提供商不需要认证，使用空 API Key`);
          provider.apiKey = '';
          isProviderAvailable = true;
        }

        // 只添加可用的提供商到配置中
        if (isProviderAvailable) {
          validProviders.push(provider);
        }
      }

      // 更新配置，只包含可用的提供商
      unifiedConfig.providers = validProviders;

      const providersInfo = validProviders.map(p => p.displayName).join(', ');
      logger.info(`过滤后可用的提供商: ${providersInfo}`);

      // 初始化日志配置
      chatLogger.reloadConfig();
      const chatConfig = chatLogger.getConfig();
      const enabledStatus = chatLogger.isEnabled();
      const configInfo = JSON.stringify(chatConfig);
      logger.info(`聊天日志已初始化，启用状态: ${enabledStatus}，配置: ${configInfo}`);

      // 初始化模型发现服务（统一实现，不依赖特定服务）
      this.modelDiscoveryService = new ModelDiscoveryService();
      await this.modelDiscoveryService.initialize();

      // 初始化统一适配器（工具修复使用内部硬编码配置）
      this.unifiedAdapterService = new UnifiedAdapterService(this.modelDiscoveryService, unifiedConfig);

      // 更新模型发现服务的可用提供商列表
      const availableProviders = this.unifiedAdapterService.getActiveProviders();
      this.modelDiscoveryService.updateAvailableProviders(availableProviders);
      const providerNames = availableProviders.join(', ');
      logger.info(`已更新模型发现服务的可用提供商列表: ${providerNames}`);

      logger.info('统一适配器服务初始化完成');

      // 等待模型发现服务完全初始化后，输出按供应商分组的注册模型信息
      logger.info('=== 服务初始化完成，输出可用模型信息 ===');
      this.modelDiscoveryService.logModelsByProvider();

      // 设置配置热重载服务的服务实例引用
      configReloader.setServices(this.modelDiscoveryService, this.unifiedAdapterService);
      logger.info('配置热重载服务已关联服务实例');

      // 初始化Ollama服务（直接使用ModelDiscoveryService）
      this.ollamaService = new OllamaService(this.modelDiscoveryService);

      // 初始化OpenAI兼容服务（通过统一适配器）
      this.openaiService = new OpenAICompatService(this.unifiedAdapterService);

      // 初始化控制器
      this.ollamaController = new OllamaController(this.ollamaService);
      this.openaiController = new OpenAIController(this.openaiService);
    } catch (error) {
      logger.error('服务初始化失败:', error);
      process.exit(1);
    }
  }

  private initializeConfigHotReload(): void {
    // 初始化配置热重载服务
    configReloader.initializeConfigHotReload();

    // 这里仅初始化服务，实际设置在服务初始化完成后进行
  }

  // 配置处理已移到 ConfigReloader 类  // 配置处理已移到 ConfigReloader 类

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
      const port = config.port;
      logger.success(`🚀 Ollama 兼容服务器启动成功，监听端口 ${port}`);
      logger.info(`🔍 健康检查: http://localhost:${port}/`);

      try {
        const supportedModels = await this.modelDiscoveryService.getAvailableModels();
        const modelCount = supportedModels.length;
        logger.info(`🤖 已加载 ${modelCount} 个模型:`);

        // 智能分批显示模型，基于行长度动态调整
        const maxLineLength = 80; // 最大行长度
        const indent = '   '; // 缩进

        let currentLine: string[] = [];
        let currentLength = indent.length;

        for (let i = 0; i < supportedModels.length; i++) {
          const model = supportedModels[i];
          const separator = currentLine.length > 0 ? ', ' : '';
          const additionalLength = separator.length + model.length;

          // 检查添加当前模型是否会超过行长度限制
          if (currentLength + additionalLength > maxLineLength && currentLine.length > 0) {
            // 输出当前行并开始新行
            logger.info(`${indent}${currentLine.join(', ')}`);
            currentLine = [model];
            currentLength = indent.length + model.length;
          } else {
            // 添加到当前行
            currentLine.push(model);
            currentLength += additionalLength;
          }
        }

        // 输出最后一行（如果有内容）
        if (currentLine.length > 0) {
          logger.info(`${indent}${currentLine.join(', ')}`);
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
      configReloader.cleanup();

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

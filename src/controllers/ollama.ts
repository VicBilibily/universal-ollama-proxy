import { NextFunction, Request, Response } from 'express';
import { ModelDiscoveryService } from '../services/modelDiscovery';
import { OllamaService } from '../services/ollama';
import {
  OllamaChatRequest,
  OllamaCopyRequest,
  OllamaCreateRequest,
  OllamaDeleteRequest,
  OllamaGenerateRequest,
  OllamaPullRequest,
  OllamaPushRequest,
  OllamaShowRequest,
} from '../types';
import { OllamaError, logger } from '../utils';

export class OllamaController {
  private ollamaService: OllamaService;
  private modelDiscoveryService: ModelDiscoveryService;

  constructor(ollamaService: OllamaService, modelDiscoveryService: ModelDiscoveryService) {
    this.ollamaService = ollamaService;
    this.modelDiscoveryService = modelDiscoveryService;
  }
  /**
   * GET /api/tags - 获取模型列表
   */ async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('获取模型列表请求');
      const models = await this.ollamaService.list();
      res.json(models);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/chat - 聊天接口
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaChatRequest = req.body;

      if (!request.model || !request.messages) {
        throw new OllamaError('缺少必需参数: model 和 messages', 400);
      }
      if (request.stream) {
        // 流式响应
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          for await (const chunk of this.ollamaService.chatStream(request)) {
            res.write(chunk);
          }
          res.end();
        } catch (error) {
          res.write(
            JSON.stringify({
              error: error instanceof Error ? error.message : '流式处理错误',
            }) + '\n'
          );
          res.end();
        }
      } else {
        // 非流式响应
        const response = await this.ollamaService.chat(request);
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/generate - 生成接口
   */
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaGenerateRequest = req.body;

      if (!request.model || !request.prompt) {
        throw new OllamaError('缺少必需参数: model 和 prompt', 400);
      }

      if (request.stream) {
        // 流式响应（需要实现）
        res.setHeader('Content-Type', 'application/x-ndjson');
        throw new OllamaError('暂不支持流式生成', 501);
      } else {
        const response = await this.ollamaService.generate(request);
        res.json(response);
      }
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /api/embed - 生成嵌入向量（当前版本）
   */
  async embed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('生成嵌入向量请求（当前版本）');
      // 提供模拟响应以保持兼容性
      res.json({
        model: req.body.model || 'unknown',
        embeddings: [[0.1, 0.2, 0.3]], // 模拟嵌入向量
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/embeddings - 嵌入接口（遗留版本）
   */
  async embeddings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('生成嵌入向量请求（遗留版本）');
      // 提供模拟响应以保持兼容性
      res.json({
        model: req.body.model || 'unknown',
        embedding: [0.1, 0.2, 0.3], // 模拟嵌入向量
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ps - 列出运行中的模型
   */
  async ps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('获取运行中模型列表');
      // 提供模拟响应以保持兼容性
      res.json({
        models: [], // 模拟没有运行中的模型
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/show - 显示模型信息
   */
  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaShowRequest = req.body;
      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      const response = await this.ollamaService.show(request.model);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/create - 创建模型
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaCreateRequest = req.body;

      if (!request.model || !request.modelfile) {
        throw new OllamaError('缺少必需参数: model 和 modelfile', 400);
      }

      await this.ollamaService.createModel(request.model, request.modelfile);

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify({ status: 'success' }) + '\n');
        res.end();
      } else {
        res.json({ status: 'success' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/copy - 复制模型
   */
  async copy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaCopyRequest = req.body;

      if (!request.source || !request.destination) {
        throw new OllamaError('缺少必需参数: source 和 destination', 400);
      }

      await this.ollamaService.copyModel(request.source, request.destination);
      res.json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/delete - 删除模型
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaDeleteRequest = req.body;

      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      await this.ollamaService.deleteModel(request.model);
      res.json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pull - 拉取模型
   */
  async pull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaPullRequest = req.body;

      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      await this.ollamaService.pullModel(request.model);

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify({ status: 'success' }) + '\n');
        res.end();
      } else {
        res.json({ status: 'success' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/push - 推送模型
   */
  async push(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OllamaPushRequest = req.body;

      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      await this.ollamaService.pushModel(request.model);

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify({ status: 'success' }) + '\n');
        res.end();
      } else {
        res.json({ status: 'success' });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET / - 健康检查
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        status: 'Ollama is running',
        version: '0.9.0',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/version - 版本信息
   */
  async version(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        version: '0.9.0',
      });
    } catch (error) {
      next(error);
    }
  }
}

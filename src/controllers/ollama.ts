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
   * POST /api/chat - 聊天接口（占位实现）
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('聊天接口请求（占位实现）');
      const request: OllamaChatRequest = req.body;

      if (!request.model || !request.messages) {
        throw new OllamaError('缺少必需参数: model 和 messages', 400);
      }

      // 模拟响应
      const mockResponse = {
        model: request.model,
        created_at: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: '这是一个模拟响应，实际聊天功能已被禁用。',
        },
        done: true,
      };

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify(mockResponse) + '\n');
        res.end();
      } else {
        res.json(mockResponse);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/generate - 生成接口（占位实现）
   */
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('生成接口请求（占位实现）');
      const request: OllamaGenerateRequest = req.body;

      if (!request.model || !request.prompt) {
        throw new OllamaError('缺少必需参数: model 和 prompt', 400);
      }

      // 模拟响应
      const mockResponse = {
        model: request.model,
        created_at: new Date().toISOString(),
        response: '这是一个模拟响应，实际生成功能已被禁用。',
        done: true,
        context: [],
        total_duration: 1000000,
        load_duration: 500000,
        prompt_eval_duration: 300000,
        eval_duration: 200000,
        eval_count: 10,
      };

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify(mockResponse) + '\n');
        res.end();
      } else {
        res.json(mockResponse);
      }
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /api/embed - 生成嵌入向量（占位实现）
   */
  async embed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('生成嵌入向量请求（占位实现）');
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
   * GET /api/ps - 列出运行中的模型（占位实现）
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
   * POST /api/create - 创建模型（占位实现）
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('创建模型请求（占位实现）');
      const request: OllamaCreateRequest = req.body;

      if (!request.model || !request.modelfile) {
        throw new OllamaError('缺少必需参数: model 和 modelfile', 400);
      }

      // 模拟响应
      const mockResponse = { status: 'success', message: '模拟创建成功，实际创建功能已被禁用' };

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify(mockResponse) + '\n');
        res.end();
      } else {
        res.json(mockResponse);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/copy - 复制模型（占位实现）
   */
  async copy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('复制模型请求（占位实现）');
      const request: OllamaCopyRequest = req.body;

      if (!request.source || !request.destination) {
        throw new OllamaError('缺少必需参数: source 和 destination', 400);
      }

      // 模拟响应
      res.json({ status: 'success', message: '模拟复制成功，实际复制功能已被禁用' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/delete - 删除模型（占位实现）
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('删除模型请求（占位实现）');
      const request: OllamaDeleteRequest = req.body;

      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      // 模拟响应
      res.json({ status: 'success', message: '模拟删除成功，实际删除功能已被禁用' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pull - 拉取模型（占位实现）
   */
  async pull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('拉取模型请求（占位实现）');
      const request: OllamaPullRequest = req.body;

      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      // 模拟响应
      const mockResponse = { status: 'success', message: '模拟拉取成功，实际拉取功能已被禁用' };

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify(mockResponse) + '\n');
        res.end();
      } else {
        res.json(mockResponse);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/push - 推送模型（占位实现）
   */
  async push(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('推送模型请求（占位实现）');
      const request: OllamaPushRequest = req.body;

      if (!request.model) {
        throw new OllamaError('缺少必需参数: model', 400);
      }

      // 模拟响应
      const mockResponse = { status: 'success', message: '模拟推送成功，实际推送功能已被禁用' };

      if (request.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.write(JSON.stringify(mockResponse) + '\n');
        res.end();
      } else {
        res.json(mockResponse);
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

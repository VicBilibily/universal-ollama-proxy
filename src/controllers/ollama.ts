import { NextFunction, Request, Response } from 'express';
import { OllamaService } from '../services/ollama';
import { OllamaShowRequest } from '../types';
import { OllamaError, logger } from '../utils';

export class OllamaController {
  private ollamaService: OllamaService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * GET /api/tags - 获取模型列表
   */
  async getTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('获取模型列表请求');
      const models = await this.ollamaService.list();
      res.json(models);
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
   * GET / - 健康检查
   */
  async healthCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
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

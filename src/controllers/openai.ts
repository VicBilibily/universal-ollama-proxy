import { NextFunction, Request, Response } from 'express';
import { OpenAICompatService } from '../services/openai';
import { OpenAIChatRequest, OpenAIErrorResponse } from '../types';
import { OllamaError, logger } from '../utils';

export class OpenAIController {
  private openaiService: OpenAICompatService;

  constructor(openaiService: OpenAICompatService) {
    this.openaiService = openaiService;
  }

  /**
   * POST /v1/chat/completions - OpenAI 聊天完成接口
   */
  async chatCompletions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: OpenAIChatRequest = req.body;

      if (!request.model || !request.messages) {
        const error: OpenAIErrorResponse = {
          error: {
            message: 'Missing required parameters: model and messages',
            type: 'invalid_request_error',
            param: !request.model ? 'model' : 'messages',
            code: 'missing_required_parameter',
          },
        };
        res.status(400).json(error);
        return;
      }

      if (request.stream) {
        // 流式响应
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        try {
          for await (const chunk of this.openaiService.chatCompletionsStream(request)) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (error) {
          logger.error('OpenAI 流式聊天错误:', error);
          const errorResponse: OpenAIErrorResponse = {
            error: {
              message: error instanceof Error ? error.message : 'Stream processing error',
              type: 'server_error',
            },
          };
          res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
          res.end();
        }
      } else {
        // 非流式响应
        const response = await this.openaiService.chatCompletions(request);
        res.json(response);
      }
    } catch (error) {
      logger.error('OpenAI 聊天完成错误:', error);

      if (error instanceof OllamaError) {
        const openaiError: OpenAIErrorResponse = {
          error: {
            message: error.message,
            type: 'server_error',
            code: error.statusCode.toString(),
          },
        };
        res.status(error.statusCode).json(openaiError);
      } else {
        const openaiError: OpenAIErrorResponse = {
          error: {
            message: 'Internal server error',
            type: 'server_error',
          },
        };
        res.status(500).json(openaiError);
      }
    }
  }

  /**
   * GET /v1/models - OpenAI 模型列表接口（非关键接口，模拟返回）
   */
  async listModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        object: 'list',
        data: [
          {
            id: 'doubao-1.5-lite-32k-250115',
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: 'volcengine',
          },
        ],
      });
    } catch (error) {
      logger.error('OpenAI 模型列表错误:', error);
      const openaiError: OpenAIErrorResponse = {
        error: {
          message: 'Failed to retrieve models',
          type: 'server_error',
        },
      };
      res.status(500).json(openaiError);
    }
  }
}

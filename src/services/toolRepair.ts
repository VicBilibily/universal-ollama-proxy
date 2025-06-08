// 简化的工具修复服务
import { ModelConfig } from '../types';
import { ToolRepairResult } from '../types/toolRepair';
import { logger } from '../utils';

/**
 * 简化的工具修复服务类
 * 只包含基本的工具验证和针对 Anthropic/Claude 模型的硬编码修复
 */
export class ToolRepairService {
  private cache: Map<string, ToolRepairResult> = new Map();

  constructor() {
    // 硬编码配置，使用环境变量 LOG_LEVEL
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    const validLogLevel = ['none', 'warn', 'info', 'debug'].includes(envLogLevel) ? envLogLevel : 'info';

    logger.info(
      `工具修复服务已初始化（简化版本，只包含 Anthropic/Claude 修复），日志级别: ${validLogLevel}，启用状态: true`
    );
  }

  /**
   * 修复工具列表
   */
  async repairTools(
    tools: any[] | undefined,
    modelConfig: ModelConfig,
    providerName: string
  ): Promise<ToolRepairResult> {
    // 如果没有工具，直接返回
    if (!tools || tools.length === 0) {
      return {
        allowed: true,
        repairedTools: [],
        removedTools: [],
        triggeredRules: [],
        warnings: [],
        errors: [],
      };
    }

    // 执行基本的工具格式验证和修复
    const { validTools, invalidTools, validationWarnings } = this.validateAndFixToolsStructure(tools);
    const warnings: string[] = [...validationWarnings];
    const errors: string[] = [];
    const triggeredRules: string[] = [];

    // 记录无效工具的错误信息
    for (const invalidTool of invalidTools) {
      const toolName = invalidTool.tool?.function?.name || `工具${invalidTool.index}`;
      const reason = invalidTool.reason;
      errors.push(`${toolName}: ${reason}`);
    }

    // 检查模型是否支持工具调用
    if (!modelConfig.capabilities.supports.tool_calls) {
      const modelName = modelConfig.name;
      logger.warn(`模型 ${modelName} 不支持工具调用，将移除所有工具`);
      return {
        allowed: true,
        repairedTools: [],
        removedTools: [...tools],
        triggeredRules: ['模型不支持工具调用'],
        warnings: [`模型 ${modelName} 不支持工具调用`],
        errors: [],
      };
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(validTools, modelConfig.id, providerName);

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      logger.debug('使用缓存的工具修复结果');
      return cached;
    }

    // 执行 Anthropic/Claude 特定的修复
    const { repairedTools, appliedRepairs } = this.applyAnthropicClaudeRepairs(validTools, modelConfig, providerName);
    triggeredRules.push(...appliedRepairs);

    const result: ToolRepairResult = {
      allowed: true,
      repairedTools: repairedTools,
      removedTools: invalidTools,
      triggeredRules,
      warnings,
      errors,
    };

    // 保存到缓存
    this.saveToCache(cacheKey, result);

    return result;
  }

  /**
   * 应用针对 Anthropic/Claude 模型的硬编码修复
   */
  private applyAnthropicClaudeRepairs(
    tools: any[],
    modelConfig: ModelConfig,
    providerName: string
  ): { repairedTools: any[]; appliedRepairs: string[] } {
    const appliedRepairs: string[] = [];

    // 检查是否是 Anthropic 或 Claude 模型
    const isAnthropicModel = this.isAnthropicOrClaudeModel(modelConfig.id, providerName);

    if (!isAnthropicModel) {
      // 不是 Anthropic/Claude 模型，直接返回原工具
      return { repairedTools: tools, appliedRepairs };
    }

    const modelId = modelConfig.id;
    logger.debug(`检测到 Anthropic/Claude 模型，应用特定修复: ${modelId}`);

    const repairedTools = tools.map((tool, index) => {
      const repairedTool = JSON.parse(JSON.stringify(tool)); // 深拷贝

      // 修复1: 补全缺失的 function.parameters
      if (!repairedTool.function.parameters) {
        repairedTool.function.parameters = {
          type: 'object',
          properties: {},
          required: [],
        };

        const toolName = repairedTool.function?.name || `工具${index}`;
        logger.debug(`为 Anthropic/Claude 模型补全工具参数: ${toolName}`);

        if (!appliedRepairs.includes('补全缺失的function.parameters')) {
          appliedRepairs.push('补全缺失的function.parameters');
        }
      }

      // 修复2: 确保 parameters 具有正确的结构
      if (repairedTool.function.parameters && typeof repairedTool.function.parameters === 'object') {
        let parametersRepaired = false;

        if (repairedTool.function.parameters.type !== 'object') {
          repairedTool.function.parameters.type = 'object';
          parametersRepaired = true;
        }

        if (!repairedTool.function.parameters.properties) {
          repairedTool.function.parameters.properties = {};
          parametersRepaired = true;
        }

        if (!Array.isArray(repairedTool.function.parameters.required)) {
          repairedTool.function.parameters.required = [];
          parametersRepaired = true;
        }

        if (parametersRepaired) {
          const toolName = repairedTool.function?.name || `工具${index}`;
          logger.debug(`为 Anthropic/Claude 模型修复工具参数结构: ${toolName}`);

          if (!appliedRepairs.includes('修复parameters结构')) {
            appliedRepairs.push('修复parameters结构');
          }
        }
      }

      return repairedTool;
    });

    if (appliedRepairs.length > 0) {
      const repairCount = appliedRepairs.length;
      const repairsText = appliedRepairs.join(', ');
      logger.info(`为 Anthropic/Claude 模型应用了 ${repairCount} 项修复: ${repairsText}`);
    }

    return { repairedTools, appliedRepairs };
  }

  /**
   * 检查是否是 Anthropic 或 Claude 模型
   */
  private isAnthropicOrClaudeModel(modelId: string, providerName: string): boolean {
    const modelIdLower = modelId.toLowerCase();
    const providerNameLower = providerName.toLowerCase();

    // 检查模型ID中是否包含 anthropic 或 claude
    const hasAnthropicInModel = modelIdLower.includes('anthropic') || modelIdLower.includes('claude');

    // 检查提供商是否是已知的 Anthropic 提供商
    const isAnthropicProvider = providerNameLower.includes('anthropic');

    const result = hasAnthropicInModel || isAnthropicProvider;

    logger.debug(
      `Anthropic/Claude 模型检测，模型ID: ${modelId}，提供商: ${providerName}，模型包含Anthropic: ${hasAnthropicInModel}，是Anthropic提供商: ${isAnthropicProvider}，结果: ${result}`
    );

    return result;
  }

  /**
   * 验证和修复工具结构
   */
  private validateAndFixToolsStructure(tools: any[]): {
    validTools: any[];
    invalidTools: { tool: any; index: number; reason: string }[];
    validationWarnings: string[];
  } {
    const validTools: any[] = [];
    const invalidTools: { tool: any; index: number; reason: string }[] = [];
    const validationWarnings: string[] = [];

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];

      // 检查基本结构
      if (!tool || typeof tool !== 'object') {
        invalidTools.push({
          tool,
          index: i,
          reason: '工具必须是对象',
        });
        continue;
      }

      // 尝试修复 type 字段
      let repairedTool = { ...tool };
      let needsTypeRepairing = false;

      if (!repairedTool.type || repairedTool.type !== 'function') {
        repairedTool.type = 'function';
        needsTypeRepairing = true;
        const toolName = tool.function?.name || i;
        validationWarnings.push(`工具 ${toolName}: 已自动添加/修正 type 字段为 "function"`);
      }

      // 检查 function 对象
      if (!repairedTool.function || typeof repairedTool.function !== 'object') {
        invalidTools.push({
          tool: repairedTool,
          index: i,
          reason: '工具必须包含 function 对象',
        });
        continue;
      }

      // 检查函数名称
      if (!repairedTool.function.name || typeof repairedTool.function.name !== 'string') {
        invalidTools.push({
          tool: repairedTool,
          index: i,
          reason: '函数必须有名称',
        });
        continue;
      }

      // 检查参数格式
      if (repairedTool.function.parameters && typeof repairedTool.function.parameters !== 'object') {
        invalidTools.push({
          tool: repairedTool,
          index: i,
          reason: '函数参数必须是对象',
        });
        continue;
      }

      // 工具通过验证，添加到有效工具列表
      validTools.push(repairedTool);
    }

    return {
      validTools,
      invalidTools,
      validationWarnings,
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(tools: any[], modelId: string, providerName: string): string {
    const toolsHash = JSON.stringify(tools);
    return `${providerName}:${modelId}:${this.hashString(toolsHash)}`;
  }

  /**
   * 简单的字符串哈希函数
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 保存到缓存
   */
  private saveToCache(key: string, result: ToolRepairResult): void {
    // 简单的LRU缓存清理 - 硬编码最大缓存条目数为 1000
    const maxCacheEntries = 1000;
    if (this.cache.size >= maxCacheEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  /**
   * 公共方法：验证和修复工具结构
   * 可以在外部直接调用，无论工具修复器是否启用
   */
  public validateAndRepairTools(tools: any[]): {
    validTools: any[];
    invalidTools: { tool: any; index: number; reason: string }[];
    validationWarnings: string[];
  } {
    return this.validateAndFixToolsStructure(tools);
  }
}

// 工具过滤服务
import { ModelConfig } from '../types';
import { ToolFilterCondition, ToolFilterConfig, ToolFilterResult, ToolFilterRule } from '../types/toolFilter';
import { logger } from '../utils';

/**
 * 工具过滤服务类
 * 负责验证和过滤传入的工具定义，确保它们符合模型能力和安全要求
 */
export class ToolFilterService {
  private config: ToolFilterConfig;
  private cache: Map<string, ToolFilterResult> = new Map();

  constructor(config: ToolFilterConfig) {
    this.config = config;
    this.initializeBuiltinRules();
  }

  /**
   * 初始化内置规则
   */
  private initializeBuiltinRules(): void {
    // 不再使用内置规则，所有规则由配置文件控制
    if (!this.config.rules || this.config.rules.length === 0) {
      this.config.rules = [];
      logger.info('未配置工具过滤规则，将不进行规则过滤');
    } else {
      logger.info(`已加载 ${this.config.rules.length} 条工具过滤规则`);
    }
  }

  /**
   * 过滤工具列表
   */
  async filterTools(
    tools: any[] | undefined,
    modelConfig: ModelConfig,
    providerName: string
  ): Promise<ToolFilterResult> {
    // 如果没有工具，直接返回
    if (!tools || tools.length === 0) {
      return {
        allowed: true,
        filteredTools: [],
        removedTools: [],
        triggeredRules: [],
        warnings: [],
        errors: [],
      };
    }

    // 无论工具过滤是否启用，都先执行基本的工具格式修复
    const { validTools, invalidTools, validationWarnings } = this.validateAndFixToolsStructure(tools);
    const warnings: string[] = [...validationWarnings];
    const errors: string[] = [];

    // 记录无效工具的错误信息
    for (const invalidTool of invalidTools) {
      const toolName = invalidTool.tool?.function?.name || `工具${invalidTool.index}`;
      errors.push(`${toolName}: ${invalidTool.reason}`);
    }

    // 检查全局忽略开关
    if (this.config.globalIgnore) {
      logger.debug('工具过滤已全局忽略，但已执行格式修复');
      return {
        allowed: true,
        filteredTools: validTools,
        removedTools: invalidTools,
        triggeredRules: [],
        warnings: [...warnings, '工具过滤已全局忽略'],
        errors,
      };
    }

    // 如果工具过滤未启用
    if (!this.config.enabled) {
      logger.debug('工具过滤未启用，但已执行格式修复');
      return {
        allowed: true,
        filteredTools: validTools,
        removedTools: invalidTools,
        triggeredRules: [],
        warnings,
        errors,
      };
    }

    // 检查模型是否支持工具调用
    if (!modelConfig.capabilities.supports.tool_calls) {
      logger.warn(`模型 ${modelConfig.name} 不支持工具调用，将移除所有工具`);
      return {
        allowed: true,
        filteredTools: [],
        removedTools: [...tools],
        triggeredRules: [],
        warnings: [`模型 ${modelConfig.name} 不支持工具调用`],
        errors: [],
      };
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(validTools, modelConfig.id, providerName);

    // 检查缓存
    if (this.config.performance.enableCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      logger.debug('使用缓存的工具过滤结果');
      return cached;
    }

    // 执行过滤
    const result = await this.performFiltering(validTools, modelConfig, providerName);

    // 将之前的格式修复结果合并到最终结果中
    result.removedTools.push(...invalidTools);
    result.warnings.push(...warnings);
    result.errors.push(...errors);

    // 保存到缓存
    if (this.config.performance.enableCache) {
      this.saveToCache(cacheKey, result);
    }

    return result;
  }

  /**
   * 执行实际的过滤逻辑
   */
  private async performFiltering(
    validTools: any[], // 已经过格式验证和修复的工具
    modelConfig: ModelConfig,
    providerName: string
  ): Promise<ToolFilterResult> {
    const filteredTools: any[] = [];
    const removedTools: any[] = [];
    const triggeredRules: ToolFilterRule[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // 对每个有效工具应用过滤规则
    for (let i = 0; i < validTools.length; i++) {
      // 深拷贝工具对象以避免修改原始对象
      let currentTool = JSON.parse(JSON.stringify(validTools[i]));
      let shouldRemove = false;
      let hasWarnings = false;

      // 应用所有启用的规则
      for (const rule of this.config.rules) {
        if (!rule.enabled) continue;

        // 检查规则是否适用于当前提供商和模型
        if (!this.isRuleApplicable(rule, providerName, modelConfig.id)) {
          logger.debug(`规则 ${rule.name} 不适用: provider=${providerName}, model=${modelConfig.id}`);
          continue;
        }

        logger.debug(`规则 ${rule.name} 适用，开始评估`, {
          providerName,
          modelId: modelConfig.id,
          toolName: currentTool.function?.name,
          toolStructure: JSON.stringify(currentTool, null, 2),
        });

        const ruleResult = this.evaluateRule(rule, currentTool, i);

        logger.debug(`规则 ${rule.name} 评估结果`, {
          matched: ruleResult.matched,
          reason: ruleResult.reason,
        });

        if (ruleResult.matched) {
          triggeredRules.push(rule);

          // 处理动作
          if (rule.actions) {
            switch (rule.actions.type) {
              case 'transform':
                // 转换工具格式
                if (rule.actions.transform) {
                  currentTool = this.transformToolFormat(currentTool, rule.actions.transform);
                  logger.debug(
                    `应用工具转换: ${rule.actions.transform} 到工具: ${currentTool.function?.name || '未命名'}`
                  );
                }
                break;
              case 'remove':
                shouldRemove = true;
                break;
              case 'warn':
                hasWarnings = true;
                warnings.push(`工具 ${currentTool.function?.name || '未命名'}: ${rule.description || rule.name}`);
                break;
            }
          }

          if (shouldRemove) {
            break;
          }
        }
      }

      if (shouldRemove) {
        removedTools.push({
          tool: currentTool,
          index: i,
          reason: `违反规则: ${triggeredRules.map(r => r.name).join(', ')}`,
        });

        if (hasWarnings && (this.config.logLevel === 'debug' || this.config.logLevel === 'warn')) {
          logger.warn(`移除工具 ${currentTool.function?.name || '未命名'}`, {
            reason: `违反规则: ${triggeredRules.map(r => r.name).join(', ')}`,
          });
        }
      } else {
        filteredTools.push(currentTool);
      }
    }

    return {
      allowed: true,
      filteredTools,
      removedTools,
      triggeredRules,
      warnings,
      errors,
    };
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
      let fixedTool = { ...tool };
      let needsTypeFixing = false;

      if (!fixedTool.type || fixedTool.type !== 'function') {
        fixedTool.type = 'function';
        needsTypeFixing = true;
        validationWarnings.push(`工具 ${tool.function?.name || i}: 已自动添加/修正 type 字段为 "function"`);
      }

      // 检查 function 对象
      if (!fixedTool.function || typeof fixedTool.function !== 'object') {
        invalidTools.push({
          tool: fixedTool,
          index: i,
          reason: '工具必须包含 function 对象',
        });
        continue;
      }

      // 检查函数名称
      if (!fixedTool.function.name || typeof fixedTool.function.name !== 'string') {
        invalidTools.push({
          tool: fixedTool,
          index: i,
          reason: '函数必须有名称',
        });
        continue;
      }

      // 检查参数格式
      if (fixedTool.function.parameters && typeof fixedTool.function.parameters !== 'object') {
        invalidTools.push({
          tool: fixedTool,
          index: i,
          reason: '函数参数必须是对象',
        });
        continue;
      }

      // 尝试修复参数 schema 的 required 字段
      if (fixedTool.function.parameters && typeof fixedTool.function.parameters === 'object') {
        if (fixedTool.function.parameters.type === 'object' && !Array.isArray(fixedTool.function.parameters.required)) {
          // 自动添加空的 required 数组
          fixedTool.function.parameters = {
            ...fixedTool.function.parameters,
            required: [],
          };
          validationWarnings.push(`工具 ${fixedTool.function.name}: 已自动添加 required 字段为空数组`);
        }
      }

      // 工具通过验证，添加到有效工具列表
      validTools.push(fixedTool);
    }

    return {
      validTools,
      invalidTools,
      validationWarnings,
    };
  }

  /**
   * 检查规则是否适用于当前提供商和模型
   */
  private isRuleApplicable(rule: ToolFilterRule, providerName: string, modelId: string): boolean {
    // 从条件格式中获取providers和models限制
    let providers: string[] | undefined;
    let models: string[] | undefined;

    if (!Array.isArray(rule.conditions) && typeof rule.conditions === 'object') {
      // 从conditions对象中获取
      providers = rule.conditions.providers;
      models = rule.conditions.models;
    }

    // 检查提供商限制
    if (providers && providers.length > 0) {
      if (!providers.includes(providerName)) {
        return false;
      }
    }

    // 检查模型限制
    if (models && models.length > 0) {
      if (
        !models.some((pattern: string) => {
          // 支持通配符模式，例如 "anthropic/*"
          if (pattern.endsWith('/*')) {
            const prefix = pattern.substring(0, pattern.length - 2);
            return modelId.startsWith(prefix);
          }
          return modelId.includes(pattern);
        })
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 评估单个规则
   */
  private evaluateRule(rule: ToolFilterRule, tool: any, toolIndex: number): { matched: boolean; reason?: string } {
    // 检查条件格式
    if (!Array.isArray(rule.conditions) && typeof rule.conditions === 'object') {
      // 条件对象格式
      const conditions = rule.conditions as { providers?: string[]; models?: string[]; toolPattern?: string };

      // 检查工具名称是否匹配模式
      if (conditions.toolPattern) {
        const toolName = tool.function?.name || '';
        const regex = new RegExp(conditions.toolPattern);
        if (!regex.test(toolName)) {
          return { matched: false, reason: `工具名称不匹配模式: ${conditions.toolPattern}` };
        }
      }

      // 条件已经通过providerName和modelId在isRuleApplicable中检查过了
      return { matched: true };
    } else {
      // 条件数组格式
      // 检查所有条件（AND逻辑）
      for (const condition of rule.conditions as ToolFilterCondition[]) {
        const conditionResult = this.evaluateCondition(condition, tool, toolIndex);
        if (!conditionResult.matched) {
          return { matched: false, reason: conditionResult.reason };
        }
      }
      return { matched: true };
    }
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(
    condition: ToolFilterCondition,
    tool: any,
    toolIndex: number
  ): { matched: boolean; reason?: string } {
    // 获取字段值
    const fieldValue = this.getFieldValue(tool, condition.field);

    logger.debug(`评估条件`, {
      field: condition.field,
      operator: condition.operator,
      fieldValue: fieldValue,
      toolStructure: JSON.stringify(tool, null, 2),
    });

    switch (condition.operator) {
      case 'exists':
        return { matched: fieldValue !== undefined && fieldValue !== null };

      case 'not_exists':
        const matched = fieldValue === undefined || fieldValue === null;
        logger.debug(`not_exists 条件结果`, {
          field: condition.field,
          fieldValue: fieldValue,
          matched: matched,
        });
        return { matched };

      case 'equals':
        return { matched: fieldValue === condition.value };

      case 'not_equals':
        return { matched: fieldValue !== condition.value };

      case 'contains':
        if (typeof fieldValue === 'string') {
          return { matched: fieldValue.includes(condition.value) };
        }
        if (Array.isArray(fieldValue)) {
          return { matched: fieldValue.includes(condition.value) };
        }
        return { matched: false, reason: '字段类型不支持 contains 操作' };

      case 'not_contains':
        if (typeof fieldValue === 'string') {
          return { matched: !fieldValue.includes(condition.value) };
        }
        if (Array.isArray(fieldValue)) {
          return { matched: !fieldValue.includes(condition.value) };
        }
        return { matched: true }; // 如果不是字符串或数组，认为不包含

      default:
        return { matched: false, reason: `未知的操作符: ${condition.operator}` };
    }
  }

  /**
   * 获取嵌套字段的值
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    const keys = fieldPath.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
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
  private saveToCache(key: string, result: ToolFilterResult): void {
    // 简单的LRU缓存清理
    if (this.cache.size >= this.config.performance.maxCacheEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: ToolFilterConfig): void {
    this.config = newConfig;
    this.cache.clear(); // 清除缓存
    logger.info('工具过滤配置已更新');
  }

  /**
   * 获取当前配置
   */
  getConfig(): ToolFilterConfig {
    return { ...this.config };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('工具过滤缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.performance.maxCacheEntries,
    };
  }

  /**
   * 公共方法：验证和修复工具结构
   * 可以在外部直接调用，无论工具过滤器是否启用
   */
  public validateAndFixTools(tools: any[]): {
    validTools: any[];
    invalidTools: { tool: any; index: number; reason: string }[];
    validationWarnings: string[];
  } {
    return this.validateAndFixToolsStructure(tools);
  }

  /**
   * 转换工具格式
   * 根据指定的转换类型对工具进行格式转换
   */
  private transformToolFormat(tool: any, transformType: string): any {
    // 深拷贝工具对象
    const transformedTool = JSON.parse(JSON.stringify(tool));

    switch (transformType) {
      case 'complete_parameters':
        // 当工具的 function.parameters 不存在时，补全为空参数对象
        if (!transformedTool.function) {
          transformedTool.function = {};
        }

        if (!transformedTool.function.parameters) {
          transformedTool.function.parameters = {
            type: 'object',
            properties: {},
            required: [],
          };

          logger.debug(`已为工具 ${transformedTool.function?.name || 'unknown'} 补全空参数对象`);
        }
        break;

      default:
        logger.warn(`未知的转换类型: ${transformType}，跳过转换`);
        break;
    }

    return transformedTool;
  }
}

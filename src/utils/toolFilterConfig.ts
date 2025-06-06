// 工具过滤配置加载器
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '.';
import { ToolFilterConfig } from '../types/toolFilter';
import { parseConfigFile } from './jsonParser';

/**
 * 工具过滤配置加载器
 */
export class ToolFilterConfigLoader {
  private static instance: ToolFilterConfigLoader;
  private config: ToolFilterConfig | null = null;
  private configPath: string;
  private lastLoadTime: Date = new Date(0);

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'tool-filter-rules.json');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ToolFilterConfigLoader {
    if (!ToolFilterConfigLoader.instance) {
      ToolFilterConfigLoader.instance = new ToolFilterConfigLoader();
    }
    return ToolFilterConfigLoader.instance;
  }

  /**
   * 加载工具过滤配置
   */
  async loadConfig(): Promise<ToolFilterConfig> {
    try {
      // 检查配置文件是否存在
      if (!fs.existsSync(this.configPath)) {
        logger.warn(`工具过滤配置文件不存在: ${this.configPath}，使用默认配置`);
        return this.getDefaultConfig();
      }

      // 检查文件修改时间
      const stats = fs.statSync(this.configPath);
      if (this.config && stats.mtime <= this.lastLoadTime) {
        logger.debug('工具过滤配置未修改，使用缓存配置');
        return this.config;
      } // 读取并解析配置文件
      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const configData = parseConfigFile(fileContent, this.configPath);

      // 验证配置格式
      const validatedConfig = this.validateConfig(configData);

      this.config = validatedConfig;
      this.lastLoadTime = stats.mtime;

      logger.info('工具过滤配置加载成功', {
        rulesCount: validatedConfig.rules.length,
        enabled: validatedConfig.enabled,
        globalIgnore: validatedConfig.globalIgnore,
      });

      return validatedConfig;
    } catch (error) {
      logger.error('加载工具过滤配置失败，使用默认配置:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  public getDefaultConfig(): ToolFilterConfig {
    return {
      enabled: true,
      globalIgnore: false,
      rules: [], // 空数组，所有规则由配置文件控制
      defaultAction: 'allow',
      logLevel: 'warn',
      performance: {
        enableCache: true,
        cacheExpiration: 300,
        maxCacheEntries: 1000,
      },
    };
  }

  /**
   * 验证配置格式
   */
  private validateConfig(configData: any): ToolFilterConfig {
    if (!configData || typeof configData !== 'object') {
      throw new Error('配置数据必须是对象');
    }

    // 设置默认值
    const defaultConfig = this.getDefaultConfig();

    const config: ToolFilterConfig = {
      enabled: typeof configData.enabled === 'boolean' ? configData.enabled : defaultConfig.enabled,
      globalIgnore: typeof configData.globalIgnore === 'boolean' ? configData.globalIgnore : defaultConfig.globalIgnore,
      rules: this.validateRules(configData.rules) || defaultConfig.rules,
      defaultAction: ['allow', 'deny'].includes(configData.defaultAction)
        ? configData.defaultAction
        : defaultConfig.defaultAction,
      logLevel: ['none', 'warn', 'info', 'debug'].includes(configData.logLevel)
        ? configData.logLevel
        : defaultConfig.logLevel,
      performance: this.validatePerformanceConfig(configData.performance) || defaultConfig.performance,
    };

    return config;
  }

  /**
   * 验证规则配置
   */
  private validateRules(rules: any): any[] | null {
    if (!Array.isArray(rules)) {
      logger.warn('规则配置不是数组，使用默认规则');
      return null;
    }

    const validRules = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (!rule || typeof rule !== 'object') {
        logger.warn(`跳过无效规则 ${i}: 不是对象`);
        continue;
      }

      // 验证必需字段
      if (!rule.name || typeof rule.name !== 'string') {
        logger.warn(`跳过无效规则 ${i}: 缺少或无效的名称`);
        continue;
      }

      // 验证启用状态
      const enabled = typeof rule.enabled === 'boolean' ? rule.enabled : true;

      // 验证条件 - 支持新的数组格式和旧的对象格式
      let validConditions = null;
      if (Array.isArray(rule.conditions)) {
        // 新格式：条件数组
        validConditions = this.validateConditions(rule.conditions, rule.name);
        if (validConditions.length === 0) {
          logger.warn(`跳过无效规则 ${rule.name}: 没有有效的条件`);
          continue;
        }
      } else if (rule.conditions && typeof rule.conditions === 'object') {
        // 旧格式：条件对象
        validConditions = rule.conditions;
      } else {
        logger.warn(`跳过无效规则 ${rule.name}: 缺少或无效的条件`);
        continue;
      }

      // 验证动作 - 支持新的actions格式和旧的action格式
      let validActions = null;
      if (rule.actions && typeof rule.actions === 'object') {
        // 新格式：actions对象
        if (!rule.actions.type || !['remove', 'warn', 'transform'].includes(rule.actions.type)) {
          logger.warn(`跳过无效规则 ${rule.name}: 无效的动作类型`);
          continue;
        }

        // 如果是transform类型，验证transform字段
        if (
          rule.actions.type === 'transform' &&
          (!rule.actions.transform || typeof rule.actions.transform !== 'string')
        ) {
          logger.warn(`跳过无效规则 ${rule.name}: transform类型需要有效的transform字段`);
          continue;
        }

        validActions = rule.actions;
      } else if (rule.action && ['remove', 'reject', 'warn'].includes(rule.action)) {
        // 旧格式：action字段
        validActions = { type: rule.action === 'reject' ? 'remove' : rule.action };
      } else {
        logger.warn(`跳过无效规则 ${rule.name}: 缺少或无效的动作`);
        continue;
      }

      // 构建有效规则
      const validRule: any = {
        name: rule.name,
        description: rule.description || '',
        enabled,
        conditions: validConditions,
        actions: validActions,
        priority: typeof rule.priority === 'number' ? rule.priority : 100,
        logLevel: ['none', 'warn', 'info', 'debug'].includes(rule.logLevel) ? rule.logLevel : 'warn',
      };

      // 保留旧格式兼容性
      if (rule.action) {
        validRule.action = rule.action;
      }
      if (rule.type) {
        validRule.type = rule.type;
      }
      if (Array.isArray(rule.providers)) {
        validRule.providers = rule.providers;
      }
      if (Array.isArray(rule.models)) {
        validRule.models = rule.models;
      }

      validRules.push(validRule);
    }

    return validRules;
  }

  /**
   * 验证条件配置
   */
  private validateConditions(conditions: any[], ruleName: string): any[] {
    const validConditions = [];

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];

      if (!condition || typeof condition !== 'object') {
        logger.warn(`规则 ${ruleName} 的条件 ${i} 无效: 不是对象`);
        continue;
      }

      if (!condition.field || typeof condition.field !== 'string') {
        logger.warn(`规则 ${ruleName} 的条件 ${i} 无效: 缺少或无效的字段`);
        continue;
      }

      const validOperators = ['equals', 'contains', 'matches', 'not_equals', 'not_contains', 'exists', 'not_exists'];
      if (!condition.operator || !validOperators.includes(condition.operator)) {
        logger.warn(`规则 ${ruleName} 的条件 ${i} 无效: 无效的操作符`);
        continue;
      }

      // 对于 matches 操作符，验证正则表达式
      if (condition.operator === 'matches') {
        if (!condition.regex || typeof condition.regex !== 'string') {
          logger.warn(`规则 ${ruleName} 的条件 ${i} 无效: matches 操作符需要正则表达式`);
          continue;
        }

        try {
          new RegExp(condition.regex);
        } catch (error) {
          logger.warn(`规则 ${ruleName} 的条件 ${i} 无效: 正则表达式格式错误 - ${error}`);
          continue;
        }
      }

      validConditions.push(condition);
    }

    return validConditions;
  }

  /**
   * 验证性能配置
   */
  private validatePerformanceConfig(performance: any): any | null {
    if (!performance || typeof performance !== 'object') {
      return null;
    }

    return {
      enableCache: typeof performance.enableCache === 'boolean' ? performance.enableCache : true,
      cacheExpiration:
        typeof performance.cacheExpiration === 'number' && performance.cacheExpiration > 0
          ? performance.cacheExpiration
          : 300,
      maxCacheEntries:
        typeof performance.maxCacheEntries === 'number' && performance.maxCacheEntries > 0
          ? performance.maxCacheEntries
          : 1000,
    };
  }

  /**
   * 保存配置到文件
   */
  async saveConfig(config: ToolFilterConfig): Promise<void> {
    try {
      // 确保配置目录存在
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // 写入配置文件
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');

      // 更新缓存
      this.config = config;
      this.lastLoadTime = new Date();

      logger.info('工具过滤配置保存成功', { path: this.configPath });
    } catch (error) {
      logger.error('保存工具过滤配置失败:', error);
      throw error;
    }
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<ToolFilterConfig> {
    this.lastLoadTime = new Date(0); // 强制重新加载
    return this.loadConfig();
  }

  /**
   * 检查配置文件是否存在
   */
  configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

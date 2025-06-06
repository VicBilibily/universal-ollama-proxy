// 工具过滤配置类型定义

/**
 * 工具过滤规则
 */
export interface ToolFilterRule {
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description: string;
  /** 是否启用此规则 */
  enabled: boolean;
  /** 规则类型 (可选) */
  type?: 'blacklist' | 'whitelist' | 'pattern' | 'validation';
  /** 规则条件 - 可以是条件数组或条件对象 */
  conditions:
    | ToolFilterCondition[]
    | {
        /** 应用的提供商，空表示所有提供商 */
        providers?: string[];
        /** 应用的模型，空表示所有模型 */
        models?: string[];
        /** 匹配工具的正则表达式 */
        toolPattern?: string;
      };
  /** 动作配置 */
  actions?: {
    /** 动作类型 */
    type: 'transform' | 'remove' | 'warn';
    /** 转换类型（当type为transform时使用） */
    transform?: string;
  };
  /** 规则优先级，数值越大优先级越高 */
  priority?: number;
  /** 规则日志级别 */
  logLevel?: 'none' | 'warn' | 'info' | 'debug';
}

/**
 * 工具过滤条件
 */
export interface ToolFilterCondition {
  /** 字段路径，支持点号分隔的嵌套路径 */
  field: string;
  /** 操作符 */
  operator:
    | 'equals'
    | 'contains'
    | 'matches'
    | 'not_equals'
    | 'not_contains'
    | 'exists'
    | 'not_exists'
    | 'not_matches'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal'
    | 'less_than_or_equal';
  /** 比较值 */
  value?: any;
  /** 正则表达式（当operator为matches时使用） */
  regex?: string;
}

/**
 * 工具过滤配置
 */
export interface ToolFilterConfig {
  /** 是否启用工具过滤 */
  enabled: boolean;
  /** 全局忽略过滤（紧急开关） */
  globalIgnore: boolean;
  /** 过滤规则列表 */
  rules: ToolFilterRule[];
  /** 默认动作：当没有规则匹配时的行为 */
  defaultAction: 'allow' | 'deny';
  /** 日志级别 */
  logLevel: 'none' | 'warn' | 'info' | 'debug';
  /** 性能设置 */
  performance: {
    /** 是否启用缓存 */
    enableCache: boolean;
    /** 缓存过期时间（秒） */
    cacheExpiration: number;
    /** 最大缓存条目数 */
    maxCacheEntries: number;
  };
}

/**
 * 工具过滤结果
 */
export interface ToolFilterResult {
  /** 是否允许通过 */
  allowed: boolean;
  /** 过滤后的工具列表 */
  filteredTools: any[];
  /** 被移除的工具列表 */
  removedTools: any[];
  /** 触发的规则 */
  triggeredRules: ToolFilterRule[];
  /** 警告信息 */
  warnings: string[];
  /** 错误信息 */
  errors: string[];
}

/**
 * 工具验证错误类型
 */
export interface ToolValidationError {
  /** 工具索引 */
  toolIndex: number;
  /** 工具名称 */
  toolName?: string;
  /** 错误类型 */
  type: 'missing_required' | 'invalid_type' | 'invalid_format' | 'unsupported_feature';
  /** 错误字段 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 期望值 */
  expected?: any;
  /** 实际值 */
  actual?: any;
}

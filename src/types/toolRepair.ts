// 工具修复类型定义

/**
 * 工具修复结果
 */
export interface ToolRepairResult {
  /** 是否允许通过 */
  allowed: boolean;
  /** 修复后的工具列表 */
  repairedTools: any[];
  /** 被移除的工具列表 */
  removedTools: any[];
  /** 触发的修复规则名称（硬编码规则） */
  triggeredRules: string[];
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

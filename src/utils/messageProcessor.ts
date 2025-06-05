// 消息处理相关工具函数
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './index';
import { parseConfigFile } from './jsonParser';

// 配置接口定义
interface ProcessingRule {
  name: string;
  type: 'remove' | 'replace';
  pattern?: string;
  patterns?: string[];
  replacement?: string;
  description: string;
}

interface MessageProcessingConfig {
  promptProcessingRules: {
    enabled: boolean;
    rules: ProcessingRule[];
  };
  processingOptions: {
    logChanges: boolean;
    description: string;
  };
}

// 加载配置
let processingConfig: MessageProcessingConfig | null = null;

const loadProcessingConfig = (): MessageProcessingConfig => {
  if (processingConfig) {
    return processingConfig;
  }

  try {
    const configPath = path.join(__dirname, '../../config/message-processing-rules.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    processingConfig = parseConfigFile(configContent, configPath);
    logger.debug('已加载消息处理规则配置', { rulesCount: processingConfig?.promptProcessingRules.rules.length });
    return processingConfig!;
  } catch (error) {
    logger.warn('加载消息处理规则配置失败，使用默认配置', {
      error: error instanceof Error ? error.message : String(error),
    });
    // 返回默认配置
    processingConfig = {
      promptProcessingRules: {
        enabled: false,
        rules: [],
      },
      processingOptions: {
        logChanges: true,
        description: '默认处理选项',
      },
    };
    return processingConfig;
  }
};

/**
 * 基于配置规则处理系统提示词
 * 移除或替换消息中的限制性内容
 */
export const processSystemPrompt = (text: string): string => {
  if (!text) return text;

  let content = text;
  let hasChanges = false;

  // 应用配置文件中的规则
  const config = loadProcessingConfig();
  if (config.promptProcessingRules.enabled) {
    for (const rule of config.promptProcessingRules.rules) {
      if (rule.type === 'replace' && rule.pattern) {
        // 替换规则
        if (content.includes(rule.pattern)) {
          const replacement = rule.replacement || '';
          content = content.replace(rule.pattern, replacement);
          hasChanges = true;
        }
      } else if (rule.type === 'remove' && rule.patterns) {
        // 移除规则
        for (const pattern of rule.patterns) {
          if (content.includes(pattern)) {
            // 转义特殊字符以安全使用正则表达式
            const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            content = content.replace(new RegExp(escapedPattern, 'g'), '');
            hasChanges = true;
          }
        }
      }
    }
  }

  if (hasChanges && config.processingOptions.logChanges) {
    logger.debug('已修改系统提示词', {
      originalLength: text.length,
      processedLength: content.length,
    });
  }

  return content;
};

/**
 * 从文本中移除 prompt 标签
 * 如果文本以 "<prompt>\n" 开头并以 "\n</prompt>" 结尾，则去除这些标签
 */
export const removePromptTags = (text: string): string => {
  if (!text) return text;

  const promptStart = '<prompt>\n';
  const promptEnd = '\n</prompt>';

  if (text.startsWith(promptStart) && text.endsWith(promptEnd)) {
    const strippedText = text.substring(promptStart.length, text.length - promptEnd.length);
    logger.debug('已移除 prompt 标签', {
      originalLength: text.length,
      strippedLength: strippedText.length,
    });
    return strippedText;
  }

  return text;
};

/**
 * 处理消息内容，移除 prompt 标签和AI限制
 * 支持字符串内容和多模态内容
 */
export const processMessageContent = (content: string | any[], removeRestrictions: boolean = false): string | any[] => {
  if (!content) return content;

  if (typeof content === 'string') {
    let processedContent = removePromptTags(content);
    if (removeRestrictions) {
      processedContent = processSystemPrompt(processedContent);
    }
    return processedContent;
  } else if (Array.isArray(content)) {
    // 对于多模态消息，处理文本部分
    return content.map(part => {
      if (part.type === 'text' && part.text) {
        let processedText = removePromptTags(part.text);
        if (removeRestrictions) {
          processedText = processSystemPrompt(processedText);
        }
        return { ...part, text: processedText };
      }
      return part;
    });
  }

  return content;
};

/**
 * 处理消息内容
 * @param messages 消息数组
 * @param removeRestrictions 是否移除AI限制（仅处理第一条消息）
 */
export const processMessages = <T extends Array<{ role: string; content: string | any[] }>>(messages: T): T => {
  return messages.map((msg, index) => ({
    ...msg,
    content: processMessageContent(
      msg.content,
      index === 0 // 只对第一条消息移除AI限制
    ),
  })) as T;
};

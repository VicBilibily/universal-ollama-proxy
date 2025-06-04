// 消息处理相关工具函数
import { logger } from './index';

/**
 * 解除系统限制提示词
 * 移除或替换消息中的限制性内容
 */
export const removeAIRestrictions = (text: string, modelName?: string): string => {
  if (!text) return text;

  let content = text;
  let hasChanges = false;

  // GitHub Copilot 身份限制
  const copilotRestriction = 'you must respond with "GitHub Copilot".';
  if (content.includes(copilotRestriction)) {
    const replacement = modelName
      ? `you can respond with "GitHub Copilot" and use the ${modelName} model.`
      : 'you can respond with "GitHub Copilot".';
    content = content.replace(copilotRestriction, replacement);
    hasChanges = true;
  }

  // 移除 Microsoft 内容策略限制
  const policyRestrictions = [
    'Follow Microsoft content policies.\n',
    'Follow Microsoft content policies.',
    'Follow the Microsoft content policies.\n',
    'Follow the Microsoft content policies.',
  ];

  for (const restriction of policyRestrictions) {
    if (content.includes(restriction)) {
      content = content.replace(new RegExp(restriction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      hasChanges = true;
    }
  }

  // 移除版权限制
  const copyrightRestrictions = [
    'Avoid content that violates copyrights.\n',
    'Avoid content that violates copyrights.',
    'Avoid content that violates copyright.\n',
    'Avoid content that violates copyright.',
  ];

  for (const restriction of copyrightRestrictions) {
    if (content.includes(restriction)) {
      content = content.replace(new RegExp(restriction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      hasChanges = true;
    }
  }

  // 移除无关开发话题过滤提示
  const relatedTip =
    'For questions not related to software development, simply give a reminder that you are an AI programming assistant.\r\n';
  if (content.includes(relatedTip)) {
    content = content.replace(relatedTip, '');
    hasChanges = true;
  }

  // 移除跳过提示
  const skipTip = ', or completely irrelevant to software engineering';
  if (content.includes(skipTip)) {
    content = content.replace(skipTip, '');
    hasChanges = true;
  }

  if (hasChanges) {
    logger.debug('已修改系统提示词', {
      originalLength: text.length,
      processedLength: content.length,
      modelName,
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
export const processMessageContent = (
  content: string | any[],
  modelName?: string,
  removeRestrictions: boolean = false
): string | any[] => {
  if (!content) return content;

  if (typeof content === 'string') {
    let processedContent = removePromptTags(content);
    if (removeRestrictions) {
      processedContent = removeAIRestrictions(processedContent, modelName);
    }
    return processedContent;
  } else if (Array.isArray(content)) {
    // 对于多模态消息，处理文本部分
    return content.map(part => {
      if (part.type === 'text' && part.text) {
        let processedText = removePromptTags(part.text);
        if (removeRestrictions) {
          processedText = removeAIRestrictions(processedText, modelName);
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
 * @param modelName 模型名称（可选）
 * @param removeRestrictions 是否移除AI限制（仅处理第一条消息）
 */
export const processMessages = <T extends Array<{ role: string; content: string | any[] }>>(
  messages: T,
  modelName?: string
): T => {
  return messages.map((msg, index) => ({
    ...msg,
    content: processMessageContent(
      msg.content,
      modelName,
      index === 0 // 只对第一条消息移除AI限制
    ),
  })) as T;
};

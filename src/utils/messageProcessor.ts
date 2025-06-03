// 消息处理相关工具函数
import { logger } from './index';

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
 * 处理消息内容，移除 prompt 标签
 * 支持字符串内容和多模态内容
 */
export const processMessageContent = (content: string | any[]): string | any[] => {
  if (!content) return content;

  if (typeof content === 'string') {
    return removePromptTags(content);
  } else if (Array.isArray(content)) {
    // 对于多模态消息，处理文本部分
    return content.map(part => {
      if (part.type === 'text' && part.text) {
        return { ...part, text: removePromptTags(part.text) };
      }
      return part;
    });
  }

  return content;
};

/**
 * 处理所有消息内容，移除 prompt 标签
 */
export const processMessages = <T extends Array<{ role: string; content: string | any[] }>>(messages: T): T => {
  return messages.map(msg => ({
    ...msg,
    content: processMessageContent(msg.content),
  })) as T;
};

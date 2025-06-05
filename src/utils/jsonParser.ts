// JSON解析工具 - 支持注释和尾随逗号
import stripJsonComments from 'strip-json-comments';

/**
 * 解析带注释和尾随逗号的JSON字符串
 * @param jsonString JSON字符串
 * @returns 解析后的对象
 */
export function parseJsonWithComments(jsonString: string): any {
  // 1. 首先去除注释
  let cleanedContent = stripJsonComments(jsonString);

  // 2. 处理尾随逗号
  // 匹配对象或数组中的尾随逗号（逗号后面只有空白字符和右括号/右方括号）
  cleanedContent = cleanedContent
    .replace(/,(\s*[}\]])/g, '$1') // 移除对象和数组的尾随逗号
    .replace(/,(\s*\n\s*[}\]])/g, '$1'); // 移除跨行的尾随逗号

  // 3. 解析JSON
  return JSON.parse(cleanedContent);
}

/**
 * 安全地解析JSON配置文件
 * @param content 文件内容
 * @param filePath 文件路径（用于错误信息）
 * @returns 解析后的对象
 */
export function parseConfigFile(content: string, filePath: string): any {
  try {
    return parseJsonWithComments(content);
  } catch (error) {
    throw new Error(`解析配置文件失败: ${filePath}, 错误: ${error instanceof Error ? error.message : String(error)}`);
  }
}

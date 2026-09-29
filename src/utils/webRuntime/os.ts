/**
 * 浏览器语言检测模块
 * 提供界面语言检测能力（navigator.language）
 */

/**
 * 获取浏览器的语言设置
 *
 * 返回浏览器首选语言设置，作为界面语言检测来源；
 * 用户在应用内手动选择的语言（localStorage 持久化）优先级更高。
 *
 * @returns {Promise<string>} BCP 47 语言标签（如 "zh-CN"、"en-US"）
 *
 * @example
 * ```typescript
 * import { locale } from '@/utils/webRuntime';
 *
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US" 等
 * ```
 */
export const locale = async (): Promise<string> => {
  // 浏览器环境：使用浏览器语言设置
  return navigator.language;
};

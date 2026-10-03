/**
 * 平台层浏览器语言与平台检测模块
 * 语言设置直接读取浏览器 navigator.language
 */

/**
 * 获取浏览器的语言设置
 *
 * @returns {Promise<string>} BCP 47 语言标签（如 "zh-CN"、"en-US"）
 *
 * @example
 * ```typescript
 * import { locale } from '@/utils/platform';
 *
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US" 等
 * ```
 */
export const locale = async (): Promise<string> => {
  return navigator.language;
};

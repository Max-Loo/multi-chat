/**
 * 语言检测模块
 * 使用浏览器原生 API 获取用户首选语言设置
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

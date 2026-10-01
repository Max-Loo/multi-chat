/**
 * 语言检测模块
 * 使用浏览器标准 API（navigator.language）获取语言设置
 */

/**
 * 获取浏览器的语言设置
 *
 * 返回浏览器的首选语言设置
 *
 * @returns {Promise<string>} BCP 47 语言标签（如 "zh-CN"、"en-US"）
 *
 * @example
 * ```typescript
 * import { locale } from '@/utils/tauriCompat';
 *
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US" 等
 * ```
 */
export const locale = async (): Promise<string> => {
  // 使用浏览器语言设置
  return navigator.language;
};

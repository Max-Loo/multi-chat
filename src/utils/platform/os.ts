/**
 * 语言偏好模块
 * 基于浏览器语言偏好提供系统语言设置
 */

/**
 * 获取浏览器的首选语言设置
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

/**
 * 平台语言信息服务
 * 提供统一的浏览器语言设置获取
 */

/**
 * 获取浏览器的语言设置
 *
 * @returns {Promise<string>} BCP 47 语言标签（如 "zh-CN"、"en-US"）
 *
 * @example
 * ```typescript
 * import { locale } from '@/platform';
 *
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US" 等
 * ```
 */
export const locale = async (): Promise<string> => {
  return navigator.language;
};

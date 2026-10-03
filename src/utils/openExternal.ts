/**
 * 外部链接打开工具模块
 * 在浏览器新标签页以 noopener 方式打开外部 URL
 */

/**
 * 在浏览器新标签页打开外部 URL
 * 使用 window.open 并携带 noopener,noreferrer，防止新页面通过 window.opener 反向操控本页面
 *
 * @param {string} url - 要打开的外部 URL
 *
 * @example
 * ```typescript
 * import { openExternal } from '@/utils/openExternal';
 *
 * openExternal('https://example.com');
 * ```
 */
export const openExternal = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

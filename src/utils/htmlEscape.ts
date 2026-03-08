/**
 * HTML 转义工具
 */

/**
 * 转义 HTML 特殊字符
 * @param text - 待转义的文本
 * @returns 转义后的 HTML 字符串
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 转义 HTML 特殊字符（备用实现）
 * @param text - 待转义的文本
 * @returns 转义后的 HTML 字符串
 */
export function escapeHtmlManual(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

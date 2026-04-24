/**
 * 创建 dompurify 共享 mock
 * 移除 script 标签和危险 HTML 属性（onerror/onload）
 */
export function createDompurifyMock() {
  return {
    default: {
      sanitize: (html: string) => {
        return html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/onerror=["'][^"']*["']/gi, '')
          .replace(/onload=["'][^"']*["']/gi, '');
      },
    },
  };
}

import { vi } from 'vitest';

/**
 * 创建 markdown-it 共享 mock
 * 基于 ThinkingSection 的更完整版本，支持加粗、斜体、代码块和换行
 */
export function createMarkdownItMock() {
  return {
    default: vi.fn(() => ({
      render: (str: string) => {
        return str
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
          .replace(/\n/g, '<br>');
      },
    })),
  };
}

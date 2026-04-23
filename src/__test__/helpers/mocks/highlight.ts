/**
 * highlight.js 共享 Mock
 *
 * ChatBubble 和 ThinkingSection 测试共用相同的 highlight.js mock
 */

/** highlight.js vi.mock 工厂对象 */
export const highlightJsMockFactory = {
  default: {
    highlight: (str: string, _options: { language: string }) => ({ value: str }),
    highlightAuto: (str: string) => ({ value: str }),
    getLanguage: (lang: string) => lang !== undefined,
  },
};

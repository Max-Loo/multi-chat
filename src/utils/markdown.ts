import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/atom-one-dark.css";
import markdownit from "markdown-it";
import { getHighlightLanguageManager } from "./highlightLanguageManager";
import { updateCodeBlockDOM } from "./codeBlockUpdater";
import { escapeHtml } from "./htmlEscape";

// 预加载常见语言
const PRELOAD_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'xml', // HTML
  'css',
  'bash',
  'json',
  'markdown',
  'sql',
  'go',
  'rust',
  'yaml',
  'csharp',
];

// 预加载语言（保留变量引用以便垃圾回收器不会过早清理）
// @ts-ignore - 保留 Promise 引用
let _preloadPromise: Promise<void> | null = null;

/**
 * 初始化预加载（异步）
 * 📝 说明：预加载是异步的，如果用户立即查看代码块，会先显示纯文本
 * 然后通过 DOM 更新替换为高亮代码（200-500ms 延迟）
 */
function initPreload(): void {
  const manager = getHighlightLanguageManager();

  // 异步预加载（不阻塞渲染）
  _preloadPromise = manager.preloadLanguages(PRELOAD_LANGUAGES);
}

// 启动预加载
initPreload();

/**
 * 创建 markdown-it 实例（缓存到模块级别，避免重复创建）
 */
function createMarkdownInstance() {
  const manager = getHighlightLanguageManager();

  return markdownit({
    highlight: function (str: string, lang: string) {
      if (!lang) {
        // 无语言标记 → 使用 highlightAuto
        return `<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2">${hljs.highlightAuto(str).value}</code></pre>`;
      }

      // 第一阶段：同步检查
      const isLoaded = manager.isLoaded(lang);

      if (isLoaded) {
        // 预加载语言 → 立即高亮
        const highlighted = manager.highlightSync(str, lang);
        return `<pre><code class="hljs rounded-xl mt-2 mb-2 scrollbar-none overflow-x-auto language-${lang}">${highlighted}</code></pre>`;
      }

      // 罕见语言 → 检查是否支持
      const isSupported = manager.isSupportedLanguage(lang);

      if (!isSupported) {
        // 不支持的语言 → 直接返回纯文本，完全避免加载
        return `<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2 language-${lang}">${escapeHtml(str)}</code></pre>`;
      }

      // 支持但未加载的语言 → 异步加载 + DOM 更新
      manager.loadLanguageAsync(lang)
        .then(() => {
          // 加载成功 → 更新 DOM
          const highlighted = manager.highlightSync(str, lang);
          updateCodeBlockDOM(str, lang, highlighted);
        })
        .catch((_error) => {
          // 加载失败 → 静默失败（保持纯文本显示）
        });

      // 立即返回纯文本（不等待异步加载）
      return `<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2 language-${lang}">${escapeHtml(str)}</code></pre>`;
    },
  });
}

// 缓存 markdown-it 实例（模块级别，只创建一次）
const markdownInstance = createMarkdownInstance();

/**
 * 将 markdown 字符串转换成安全的 html 字符串
 * @param dirtyMarkdown - 待转换的 markdown 字符串
 * @returns 转换后的安全 HTML 字符串
 */
export const generateCleanHtml = (dirtyMarkdown: string) => {
  return DOMPurify.sanitize(markdownInstance.render(dirtyMarkdown));
};

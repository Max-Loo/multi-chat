import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/atom-one-dark.css";
import markdownit from "markdown-it";
import { getHighlightLanguageManager } from "./highlightLanguageManager";
import { updateCodeBlockDOM } from "./codeBlockUpdater";
import { escapeHtml } from "./htmlEscape";
import { copyToClipboard } from "./clipboard";

/** 复制图标 SVG（lucide: copy） */
const COPY_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

/** 已复制图标 SVG（lucide: check） */
const CHECK_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

/**
 * 将代码块 HTML 包裹在容器中并注入复制按钮
 * @param codeHtml - `<pre><code>...</code></pre>` 格式的代码块 HTML
 */
function wrapCodeBlock(codeHtml: string): string {
  return `<div class="code-block-wrapper"><button class="code-copy-btn" type="button" title="复制代码">${COPY_ICON_SVG}</button>${codeHtml}</div>`;
}

/**
 * 全局点击事件委托 — 处理代码块复制按钮点击
 */
function handleCodeCopyClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const btn = target.closest<HTMLButtonElement>('.code-copy-btn');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  // 从相邻 code 元素获取纯文本
  const wrapper = btn.parentElement;
  const codeEl = wrapper?.querySelector('code');
  if (!codeEl) return;

  const code = codeEl.textContent?.trim() ?? '';
  copyToClipboard(code).then(() => {
    // 复制成功 — 切换为"已复制"状态
    btn.innerHTML = CHECK_ICON_SVG;
    btn.classList.add('copied');
    btn.title = '已复制';

    // 2 秒后恢复初始状态
    setTimeout(() => {
      btn.innerHTML = COPY_ICON_SVG;
      btn.classList.remove('copied');
      btn.title = '复制代码';
    }, 2000);
  }).catch(() => {
    // 复制失败 — 短暂抖动反馈后恢复
    btn.classList.add('copy-failed');
    setTimeout(() => {
      btn.classList.remove('copy-failed');
    }, 1000);
  });
}

// 模块初始化时注册全局事件委托（仅注册一次）
document.addEventListener('click', handleCodeCopyClick);

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
        return wrapCodeBlock(`<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2">${hljs.highlightAuto(str).value}</code></pre>`);
      }

      const isLoaded = manager.isLoaded(lang);

      if (isLoaded) {
        const highlighted = manager.highlightSync(str, lang);
        return wrapCodeBlock(`<pre><code class="hljs rounded-xl mt-2 mb-2 scrollbar-none overflow-x-auto language-${lang}">${highlighted}</code></pre>`);
      }

      const isSupported = manager.isSupportedLanguage(lang);

      if (!isSupported) {
        return wrapCodeBlock(`<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2 language-${lang}">${escapeHtml(str)}</code></pre>`);
      }

      manager.loadLanguageAsync(lang)
        .then(() => {
          const highlighted = manager.highlightSync(str, lang);
          updateCodeBlockDOM(str, lang, highlighted);
        })
        .catch((_error) => {
          // 静默失败
        });

      return wrapCodeBlock(`<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2 language-${lang}">${escapeHtml(str)}</code></pre>`);
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
  if (!dirtyMarkdown) return '';
  return DOMPurify.sanitize(markdownInstance.render(dirtyMarkdown), {
    ADD_TAGS: ['button', 'svg', 'path', 'polyline', 'rect'],
    ADD_ATTR: ['d', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'rx', 'ry', 'points', 'width', 'height', 'x', 'y', 'type'],
  });
};

import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import markdownit from "markdown-it";

/**
 * 将 markdown 字符串转换成安全的 html 字符串
 * @param dirtyMarkdown - 待转换的 markdown 字符串
 * @returns 转换后的安全 HTML 字符串
 */
export const generateCleanHtml = (dirtyMarkdown: string) => {
  const marked = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return `<pre><code class="hljs rounded-xl mt-2 mb-2 scrollbar-none overflow-x-auto language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      }
      // 未识别语言也做默认高亮
      return `<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2">${hljs.highlightAuto(str).value}</code></pre>`;
    },
  });

  return DOMPurify.sanitize(marked.render(dirtyMarkdown));
};

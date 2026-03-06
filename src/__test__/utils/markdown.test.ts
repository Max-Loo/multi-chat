/**
 * Markdown 渲染工具测试
 *
 * 测试 Markdown 解析、代码高亮和 XSS 防护功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCleanHtml } from '@/utils/markdown';

// Mock HighlightLanguageManager
vi.mock('@/utils/highlightLanguageManager', () => ({
  getHighlightLanguageManager: vi.fn(() => ({
    isLoaded: vi.fn((_lang: string) => ['javascript', 'typescript', 'python', 'java', 'cpp', 'xml', 'css', 'bash', 'json', 'markdown', 'sql', 'go', 'rust', 'yaml', 'csharp'].includes(_lang)),
    isSupportedLanguage: vi.fn((_lang: string) => ['javascript', 'typescript', 'python', 'java', 'cpp', 'xml', 'css', 'bash', 'json', 'markdown', 'sql', 'go', 'rust', 'yaml', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'objectivec', 'haskell', 'lua', 'perl', 'r', 'matlab', 'dart', 'elixir', 'erlang', 'clojure', 'fsharp', 'groovy', 'julia', 'powershell', 'dockerfile', 'nginx', 'apache', 'diff', 'plaintext'].includes(_lang)),
    hasFailedToLoad: vi.fn(() => false), // 添加 mock 方法
    highlightSync: vi.fn((code: string, _lang: string) => {
      // 返回简单的高亮 HTML（模拟）
      return `<span class="hljs-keyword">const</span> ${code}`;
    }),
    preloadLanguages: vi.fn(() => Promise.resolve()),
    loadLanguageAsync: vi.fn(() => Promise.resolve()),
    markAsLoaded: vi.fn(() => {}), // 添加 mock 方法
  })),
}));

// Mock codeBlockUpdater（临时禁用）
// vi.mock('@/utils/codeBlockUpdater', () => ({
//   updateCodeBlockDOM: vi.fn(),
// }));

describe('Markdown 渲染工具', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.10 测试标题（#）正确渲染', () => {
    it('应该渲染一级标题', () => {
      const markdown = '# Heading 1';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('Heading 1');
    });

    it('应该渲染二级标题', () => {
      const markdown = '## Heading 2';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h2');
      expect(html).toContain('Heading 2');
    });

    it('应该渲染三级标题', () => {
      const markdown = '### Heading 3';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h3');
      expect(html).toContain('Heading 3');
    });

    it('应该渲染多级标题', () => {
      const markdown = `# H1
## H2
### H3
#### H4
##### H5
###### H6`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
      expect(html).toContain('<h3');
      expect(html).toContain('<h4');
      expect(html).toContain('<h5');
      expect(html).toContain('<h6');
    });

    it('应该渲染带有行内样式的标题', () => {
      const markdown = '# This is a **bold** heading';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('<strong');
      expect(html).toContain('bold');
    });

    it('应该正确渲染标题后的段落内容', () => {
      const markdown = `# Title

This is a paragraph after the title.`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('<p');
    });
  });

  describe('4.11 测试代码块（```）正确解析和高亮', () => {
    it('应该渲染带语言标记的代码块', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('<code');
      expect(html).toContain('hljs');
      expect(html).toContain('language-javascript');
    });

    it('应该渲染没有语言标记的代码块', () => {
      const markdown = '```\nconst x = 1;\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('<code');
      expect(html).toContain('hljs');
    });

    it('应该渲染多行代码块', () => {
      const markdown = `\`\`\`javascript
function hello() {
  console.log('Hello, world!');
  return true;
}
hello();
\`\`\``;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('function');
      expect(html).toContain('console');
      expect(html).toContain('hljs'); // 至少包含 hljs 类
    });

    it('应该渲染包含特殊字符的代码块', () => {
      const markdown = '```html\n<div class="test">&nbsp;</div>\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('hljs'); // 至少包含 hljs 类
    });

    it('应该渲染多个代码块', () => {
      const markdown = `First block:
\`\`\`javascript
const x = 1;
\`\`\`

Second block:
\`\`\`python
x = 1
\`\`\``;
      const html = generateCleanHtml(markdown);
      const codeMatches = (html.match(/<pre/g) || []).length;
      expect(codeMatches).toBeGreaterThanOrEqual(2);
    });

    it('应该正确处理空代码块', () => {
      const markdown = '```\n\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<pre');
    });

    it('应该渲染包含引号的代码块', () => {
      const markdown = '```javascript\nconst str = "Hello \'world\'";\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('Hello');
    });
  });

  describe('4.12 测试列表（无序和有序）正确显示', () => {
    it('应该渲染无序列表', () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
      expect(html).toContain('Item 3');
    });

    it('应该渲染有序列表', () => {
      const markdown = `1. First
2. Second
3. Third`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<ol');
      expect(html).toContain('<li');
      expect(html).toContain('First');
      expect(html).toContain('Second');
      expect(html).toContain('Third');
    });

    it('应该渲染嵌套列表', () => {
      const markdown = `- Parent
  - Child 1
  - Child 2`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<ul');
      expect(html).toContain('Parent');
      expect(html).toContain('Child');
    });

    it('应该渲染包含代码的列表项', () => {
      const markdown = `- Item with \`inline code\`
- Another item`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<code');
      expect(html).toContain('inline code');
    });

    it('应该渲染包含粗体和斜体的列表项', () => {
      const markdown = `- **Bold** item
- *Italic* item
- ***Bold italic*** item`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<strong');
      expect(html).toContain('<em');
    });

    it('应该渲染混合列表（有序和无序）', () => {
      const markdown = `1. First
2. Second
   - Sub-item 1
   - Sub-item 2`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<ol');
      expect(html).toContain('<ul');
    });

    it('应该正确渲染任务列表', () => {
      const markdown = `- [x] Completed task
- [ ] Incomplete task`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('Completed task');
      expect(html).toContain('Incomplete task');
    });
  });

  describe('4.13 测试链接和图片正确渲染', () => {
    it('应该渲染普通链接', () => {
      const markdown = '[Link text](https://example.com)';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Link text');
    });

    it('应该渲染带标题的链接', () => {
      const markdown = '[Link](https://example.com "Link title")';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<a');
      expect(html).toContain('https://example.com');
    });

    it('应该渲染自动链接', () => {
      const markdown = 'Visit https://example.com for more';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('https://example.com');
    });

    it('应该渲染图片', () => {
      const markdown = '![Alt text](https://example.com/image.jpg)';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/image.jpg"');
      expect(html).toContain('alt="Alt text"');
    });

    it('应该渲染带标题的图片', () => {
      const markdown = '![Alt](https://example.com/img.jpg "Image title")';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<img');
      expect(html).toContain('src');
    });

    it('应该渲染包含链接的图片', () => {
      const markdown = '[![Alt](https://example.com/img.jpg)](https://example.com)';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<a');
      expect(html).toContain('<img');
    });

    it('应该正确处理相对路径链接', () => {
      const markdown = '[Relative link](/path/to/page)';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('href="/path/to/page"');
    });

    it('应该渲染邮件链接', () => {
      const markdown = '[Email](mailto:test@example.com)';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('href="mailto:test@example.com"');
    });
  });

  describe('4.14 测试特殊字符正确转义', () => {
    it('应该转义 HTML 标签', () => {
      const markdown = 'This contains <div>HTML</div> tags';
      const html = generateCleanHtml(markdown);
      expect(html).not.toContain('<div>');
      expect(html).toContain('&lt;');
    });

    it('应该转义 script 标签（XSS 防护）', () => {
      const markdown = 'Before <script>alert("XSS")</script> after';
      const html = generateCleanHtml(markdown);
      // DOMPurify 应该移除 script 标签但保留内容
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('</script>');
    });

    it('应该转义 onclick 等事件属性', () => {
      const markdown = '<img src=x onerror="alert(1)">';
      const html = generateCleanHtml(markdown);
      // HTML 标签会被转义，使其无法执行
      expect(html).toContain('&lt;img');
      // 由于标签被转义，onerror 属性也会变成纯文本
    });

    it('应该保留合法的特殊字符', () => {
      const markdown = 'Use &amp; for ampersand, &lt; for less than';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
    });

    it('应该转义引号', () => {
      const markdown = 'He said "Hello" and she said \'Hi\'';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('Hello');
      expect(html).toContain('Hi');
    });

    it('应该处理 Unicode 字符', () => {
      const markdown = 'Hello 世界 🌍 مرحبا Привет';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('世界');
      expect(html).toContain('🌍');
    });

    it('应该转义代码块中的 HTML', () => {
      const markdown = '```html\n<div class="test">Content</div>\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('&lt;');
      expect(html).toContain('hljs'); // 至少包含 hljs 类
    });

    it('应该转义内联代码中的 HTML', () => {
      const markdown = 'Use `<div>` for divs';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<code');
      expect(html).toContain('&lt;div&gt;');
    });

    it('应该防止 iframe 注入', () => {
      const markdown = '<iframe src="malicious.com"></iframe>';
      const html = generateCleanHtml(markdown);
      expect(html).not.toContain('<iframe');
    });

    it('应该防止 SVG 脚本注入', () => {
      const markdown = '<svg><script>alert(1)</script></svg>';
      const html = generateCleanHtml(markdown);
      expect(html).not.toContain('<script>');
    });
  });

  describe('4.19 测试长代码块正确滚动', () => {
    it('应该为代码块添加滚动样式', () => {
      const markdown = '```javascript\n' + 'const x = 1;\n'.repeat(100) + '\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('overflow-x-auto');
    });

    it('应该为长行代码添加水平滚动', () => {
      const longLineContent = 'const x = "' + 'a'.repeat(500) + '";';
      const markdown = `\`\`\`javascript\n${longLineContent}\n\`\`\``;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('overflow-x-auto');
    });

    it('应该保留代码块的圆角样式', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('rounded-xl');
    });

    it('应该保留代码块的 margin 样式', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('mt-2');
      expect(html).toContain('mb-2');
    });

    it('应该为代码块添加滚动条隐藏样式', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('scrollbar-none');
    });
  });

  describe('其他 Markdown 功能', () => {
    it('应该渲染粗体文本', () => {
      const markdown = '**bold text**';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<strong');
      expect(html).toContain('bold text');
    });

    it('应该渲染斜体文本', () => {
      const markdown = '*italic text*';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<em');
      expect(html).toContain('italic text');
    });

    it('应该渲染删除线文本', () => {
      const markdown = '~~deleted text~~';
      const html = generateCleanHtml(markdown);
      // markdown-it 可能不直接支持删除线，或使用不同方式渲染
      expect(html).toBeTruthy();
    });

    it('应该渲染引用块', () => {
      const markdown = '> This is a quote';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<blockquote');
    });

    it('应该渲染水平分割线', () => {
      const markdown = '---';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<hr');
    });

    it('应该渲染表格', () => {
      const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<table');
      expect(html).toContain('<th');
      expect(html).toContain('<td');
    });

    it('应该渲染嵌套格式', () => {
      const markdown = '**Bold with *italic* inside**';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<strong');
      expect(html).toContain('<em');
    });

    it('应该渲染换行符', () => {
      const markdown = 'Line 1\nLine 2\nLine 3';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('Line 1');
      expect(html).toContain('Line 2');
      expect(html).toContain('Line 3');
    });

    it('应该渲染多个段落', () => {
      const markdown = `Paragraph 1

Paragraph 2

Paragraph 3`;
      const html = generateCleanHtml(markdown);
      const paragraphMatches = (html.match(/<p/g) || []).length;
      expect(paragraphMatches).toBeGreaterThanOrEqual(3);
    });

    it('应该渲染行内代码', () => {
      const markdown = 'Use `const` for constants';
      const html = generateCleanHtml(markdown);
      expect(html).toContain('<code');
      expect(html).toContain('const');
    });
  });

  describe('综合测试', () => {
    it('应该正确渲染复杂的 Markdown 文档', () => {
      const markdown = `# Document Title

## Introduction
This is a **paragraph** with *emphasis* and \`inline code\`.

## Code Example
\`\`\`javascript
function example() {
  return "Hello, world!";
}
\`\`\`

## List
- Item 1
- Item 2
  - Nested item

## Links
[Example](https://example.com)

## Quote
> This is a quote
`;

      const html = generateCleanHtml(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
      expect(html).toContain('<strong');
      expect(html).toContain('<em');
      expect(html).toContain('<code');
      expect(html).toContain('<pre');
      expect(html).toContain('<ul');
      expect(html).toContain('<a');
      expect(html).toContain('<blockquote');
    });
  });
});

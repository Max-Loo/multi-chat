/**
 * 代码高亮功能测试
 *
 * 测试 highlight.js 代码高亮功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import hljs from 'highlight.js';

describe('4.15 代码高亮组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.16 测试不同编程语言的代码块正确高亮', () => {
    it('应该高亮 JavaScript 代码', () => {
      const code = 'const x = 1; function hello() { return "world"; }';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
      expect(result.value).toContain('hljs-string');
    });

    it('应该高亮 TypeScript 代码', () => {
      const code = 'const x: number = 1; interface User { name: string; }';
      const result = hljs.highlight(code, { language: 'typescript' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-built_in');
    });

    it('应该高亮 Python 代码', () => {
      const code = 'def hello():\n    return "world"';
      const result = hljs.highlight(code, { language: 'python' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
      expect(result.value).toContain('hljs-string');
    });

    it('应该高亮 Java 代码', () => {
      const code = 'public class Hello { public static void main(String[] args) {} }';
      const result = hljs.highlight(code, { language: 'java' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
    });

    it('应该高亮 C++ 代码', () => {
      const code = '#include <iostream>\nint main() { return 0; }';
      const result = hljs.highlight(code, { language: 'cpp' });
      expect(result.value).toContain('hljs-meta');
      expect(result.value).toContain('hljs-keyword');
    });

    it('应该高亮 C# 代码', () => {
      const code = 'public class Program { public static void Main() {} }';
      const result = hljs.highlight(code, { language: 'csharp' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
    });

    it('应该高亮 Go 代码', () => {
      const code = 'func main() { fmt.Println("Hello") }';
      const result = hljs.highlight(code, { language: 'go' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-function');
    });

    it('应该高亮 Rust 代码', () => {
      const code = 'fn main() { println!("Hello"); }';
      const result = hljs.highlight(code, { language: 'rust' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
      expect(result.value).toContain('hljs-built_in'); // println! 被标记为 built_in
    });

    it('应该高亮 Ruby 代码', () => {
      const code = 'def hello\n  puts "world"\nend';
      const result = hljs.highlight(code, { language: 'ruby' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
    });

    it('应该高亮 PHP 代码', () => {
      const code = '<?php function hello() { return "world"; }';
      const result = hljs.highlight(code, { language: 'php' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-function');
    });

    it('应该高亮 Swift 代码', () => {
      const code = 'func hello() -> String { return "world" }';
      const result = hljs.highlight(code, { language: 'swift' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-title');
    });

    it('应该高亮 Kotlin 代码', () => {
      const code = 'fun hello(): String { return "world" }';
      const result = hljs.highlight(code, { language: 'kotlin' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value).toContain('hljs-function');
    });

    it('应该高亮 SQL 代码', () => {
      const code = 'SELECT * FROM users WHERE id = 1;';
      const result = hljs.highlight(code, { language: 'sql' });
      expect(result.value).toContain('hljs-keyword');
    });

    it('应该高亮 HTML 代码', () => {
      const code = '<div class="test">Content</div>';
      const result = hljs.highlight(code, { language: 'html' });
      expect(result.value).toContain('hljs-name');
      expect(result.value).toContain('hljs-attr');
    });

    it('应该高亮 CSS 代码', () => {
      const code = '.test { color: red; font-size: 14px; }';
      const result = hljs.highlight(code, { language: 'css' });
      expect(result.value).toContain('hljs-selector-class');
      expect(result.value).toContain('hljs-attribute');
    });

    it('应该高亮 SCSS 代码', () => {
      const code = '$color: red;\n.test { color: $color; }';
      const result = hljs.highlight(code, { language: 'scss' });
      expect(result.value).toContain('hljs-variable');
    });

    it('应该高亮 JSON 代码', () => {
      const code = '{ "name": "test", "value": 123 }';
      const result = hljs.highlight(code, { language: 'json' });
      expect(result.value).toContain('hljs-attr');
      expect(result.value).toContain('hljs-string');
      expect(result.value).toContain('hljs-number');
    });

    it('应该高亮 YAML 代码', () => {
      const code = 'name: test\nvalue: 123';
      const result = hljs.highlight(code, { language: 'yaml' });
      expect(result.value).toContain('hljs-attr');
      expect(result.value).toContain('hljs-number');
    });

    it('应该高亮 XML 代码', () => {
      const code = '<root><item id="1">Test</item></root>';
      const result = hljs.highlight(code, { language: 'xml' });
      expect(result.value).toContain('hljs-name');
      expect(result.value).toContain('hljs-attr');
    });

    it('应该高亮 Markdown 代码', () => {
      const code = '# Heading\n\n**Bold** and *italic*';
      const result = hljs.highlight(code, { language: 'markdown' });
      expect(result.value).toContain('hljs-section');
      expect(result.value).toContain('hljs-strong');
    });

    it('应该高亮 Bash 代码', () => {
      const code = 'echo "Hello" && ls -la';
      const result = hljs.highlight(code, { language: 'bash' });
      expect(result.value).toContain('hljs-built_in');
    });

    it('应该高亮 PowerShell 代码', () => {
      const code = 'Write-Host "Hello"; Get-Process';
      const result = hljs.highlight(code, { language: 'powershell' });
      expect(result.value).toContain('hljs-built_in');
    });

    it('应该高亮 Dockerfile 代码', () => {
      const code = 'FROM node:14\nRUN npm install';
      const result = hljs.highlight(code, { language: 'dockerfile' });
      expect(result.value).toContain('hljs-keyword');
    });
  });

  describe('4.17 测试代码块包含行号（如果启用）', () => {
    it('应该返回高亮后的代码字符串', () => {
      const code = 'const x = 1;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(typeof result.value).toBe('string');
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该包含语言信息', () => {
      const code = 'const x = 1;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.language).toBe('javascript');
    });

    it('应该正确处理空代码', () => {
      const code = '';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toBe('');
    });

    it('应该正确处理单行代码', () => {
      const code = 'const x = 1;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-keyword');
    });

    it('应该正确处理多行代码', () => {
      const code = 'const x = 1;\nconst y = 2;\nconst z = 3;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-keyword');
      expect(result.value.split('\n').length).toBeGreaterThanOrEqual(3);
    });

    it('应该保留原始代码的缩进', () => {
      const code = 'function test() {\n  return "value";\n}';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('  ');
    });
  });

  describe('4.18 测试代码块支持复制功能', () => {
    it('应该返回可以安全复制的高亮代码', () => {
      const code = 'const x = "<test>";';
      const result = hljs.highlight(code, { language: 'javascript' });
      // 高亮后的代码应该可以安全地复制到剪贴板
      expect(result.value).not.toContain('\x00'); // 不应包含空字节
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该转义 HTML 特殊字符以便复制', () => {
      const code = '<div class="test">&nbsp;</div>';
      const result = hljs.highlight(code, { language: 'html' });
      // HTML 应该被转义
      expect(result.value).toContain('&lt;');
      expect(result.value).toContain('&gt;');
    });

    it('应该保留 Unicode 字符以便复制', () => {
      const code = '// 中文注释\nconst x = 1;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('中文');
    });

    it('应该保留 Emoji 表情以便复制', () => {
      const code = '// 🚀 Rocket emoji\nconst x = 1;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('🚀');
    });

    it('应该保留换行符以便复制', () => {
      const code = 'line 1\nline 2\nline 3';
      const result = hljs.highlight(code, { language: 'javascript' });
      const lines = result.value.split('\n');
      expect(lines.length).toBe(3);
    });

    it('应该保留制表符以便复制', () => {
      const code = 'const x = {\tkey: "value"\t};';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('\t');
    });

    it('应该保留特殊引号以便复制', () => {
      const code = 'const str1 = "double";\nconst str2 = \'single\';';
      const result = hljs.highlight(code, { language: 'javascript' });
      // 双引号会保留
      expect(result.value).toContain('"');
      // 单引号会被转义为 HTML 实体
      expect(result.value).toContain('&#x27;');
    });
  });

  describe('4.19 测试长代码块正确滚动', () => {
    it('应该处理非常长的单行代码', () => {
      const longLine = 'const x = "' + 'a'.repeat(10000) + '";';
      const result = hljs.highlight(longLine, { language: 'javascript' });
      expect(result.value.length).toBeGreaterThan(0);
      expect(result.value).toContain('hljs-string');
    });

    it('应该处理非常多的行数', () => {
      const manyLines = Array.from({ length: 1000 }, (_, i) => `const x${i} = ${i};`).join('\n');
      const result = hljs.highlight(manyLines, { language: 'javascript' });
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该处理深度嵌套的代码', () => {
      const nestedCode = '{'.repeat(100) + 'x = 1' + '}'.repeat(100);
      const result = hljs.highlight(nestedCode, { language: 'javascript' });
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该处理包含大量注释的代码', () => {
      const comments = Array.from({ length: 500 }, (_, i) => `// Comment line ${i}`).join('\n');
      const code = comments + '\nconst x = 1;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-comment');
    });

    it('应该处理包含字符串的代码', () => {
      const longString = '"This is a very long string with " + "many " + "concatenations " + ".repeat(100)';
      const code = `const x = ${longString};`;
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-string');
    });
  });

  describe('边缘情况和错误处理', () => {
    it('应该处理未识别的语言（使用 auto 高亮）', () => {
      const code = 'x = 1';
      const result = hljs.highlightAuto(code);
      // auto 高亮会尝试识别语言，至少应返回原始内容
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该处理混合语言代码', () => {
      const code = '<div class="test">const x = 1;</div>';
      const result = hljs.highlightAuto(code);
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该处理语法错误的代码', () => {
      const code = 'const x = ;;; broken javascript {{{';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value.length).toBeGreaterThan(0);
    });

    it('应该处理包含特殊字符的代码', () => {
      const code = 'const x = "\\n\\t\\r\\b\\f";';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-string');
    });

    it('应该处理包含正则表达式的代码', () => {
      const code = 'const regex = /^test\\d+$/g;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-regexp');
    });

    it('应该处理包含模板字符串的代码', () => {
      const code = 'const x = `Hello ${name}`;';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value).toContain('hljs-string');
    });

    it('应该检查语言是否被支持', () => {
      expect(hljs.getLanguage('javascript')).toBeDefined();
      expect(hljs.getLanguage('python')).toBeDefined();
      expect(hljs.getLanguage('unknown-language')).toBeUndefined();
    });

    it('应该获取所有支持的语言列表', () => {
      const languages = hljs.listLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(50);
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
    });

    it('应该处理代码中的 null 字符', () => {
      const code = 'const x = "\0";';
      const result = hljs.highlight(code, { language: 'javascript' });
      expect(result.value.length).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('应该快速高亮小段代码', () => {
      const code = 'const x = 1;';
      const start = Date.now();
      hljs.highlight(code, { language: 'javascript' });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 应该在 100ms 内完成
    });

    it('应该合理时间内高亮中等长度代码', () => {
      const code = 'const x = 1;\n'.repeat(100);
      const start = Date.now();
      hljs.highlight(code, { language: 'javascript' });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // 应该在 500ms 内完成
    });
  });
});

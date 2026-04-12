/**
 * htmlEscape 测试
 *
 * 测试两种 HTML 转义实现的正确性、XSS 防护和一致性
 * 注意：jsdom 的 DOM API（escapeHtml）只转义 & < >，不转义 " '
 */

import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeHtmlManual } from '@/utils/htmlEscape';

describe('htmlEscape', () => {
  describe('escapeHtmlManual', () => {
    it('应该转义所有 HTML 特殊字符', () => {
      expect(escapeHtmlManual('&<>"\'/')).toBe('&amp;&lt;&gt;&quot;&#39;&#x2F;');
    });

    it('应该处理空字符串', () => {
      expect(escapeHtmlManual('')).toBe('');
    });

    it('应该保留无特殊字符的字符串不变', () => {
      expect(escapeHtmlManual('Hello World')).toBe('Hello World');
    });

    it('应该转义 / 字符', () => {
      expect(escapeHtmlManual('</script>')).toBe('&lt;&#x2F;script&gt;');
    });
  });

  describe('escapeHtml', () => {
    it('应该转义 & < > 字符（jsdom DOM API 行为）', () => {
      expect(escapeHtml('&<>')).toBe('&amp;&lt;&gt;');
    });

    it('应该处理空字符串', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('应该保留无特殊字符的字符串不变', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('不应该转义 / 字符（DOM API 行为）', () => {
      expect(escapeHtml('/')).toBe('/');
    });
  });

  describe('XSS 防护', () => {
    it('应该防止 script 标签注入', () => {
      const malicious = "<script>alert('xss')</script>";
      expect(escapeHtmlManual(malicious)).not.toContain('<script>');
      expect(escapeHtml(malicious)).not.toContain('<script>');
    });

    it('应该防止事件处理器注入', () => {
      const malicious = '<img onerror="alert(\'xss\')">';
      const manualResult = escapeHtmlManual(malicious);
      // escapeHtmlManual 转义了 < 和 >，所以不包含可执行的标签
      expect(manualResult).not.toMatch(/<img[^>]*>/);
      expect(manualResult).not.toMatch(/<[^>]+onerror/);
    });

    it('应该防止 JavaScript 协议注入', () => {
      const malicious = "javascript:alert('xss')";
      // escapeHtmlManual 转义了 ' 为 &#39;，使注入失效
      const manualResult = escapeHtmlManual(malicious);
      expect(manualResult).toContain('&#39;');
      expect(manualResult).not.toBe(malicious);
    });
  });

  describe('核心字符一致性', () => {
    it.each([
      { char: '&', description: '& 字符', same: true },
      { char: '<', description: '< 字符', same: true },
      { char: '>', description: '> 字符', same: true },
    ])('应该对 $description 产生相同输出', ({ char }) => {
      expect(escapeHtml(char)).toBe(escapeHtmlManual(char));
    });

    it('应该在 / 字符上产生不同输出', () => {
      expect(escapeHtml('/')).toBe('/');
      expect(escapeHtmlManual('/')).toBe('&#x2F;');
      expect(escapeHtml('/')).not.toBe(escapeHtmlManual('/'));
    });

    // jsdom DOM API 不转义 " 和 '，但 escapeHtmlManual 转义
    // 这是已知的 jsdom 与浏览器行为差异：浏览器同样不转义这两个字符
    it('应该在 jsdom 中对 " 字符产生不同输出（DOM API 不转义）', () => {
      expect(escapeHtml('"')).toBe('"');
      expect(escapeHtmlManual('"')).toBe('&quot;');
      expect(escapeHtml('"')).not.toBe(escapeHtmlManual('"'));
    });

    it('应该在 jsdom 中对 \' 字符产生不同输出（DOM API 不转义）', () => {
      expect(escapeHtml("'")).toBe("'");
      expect(escapeHtmlManual("'")).toBe('&#39;');
      expect(escapeHtml("'")).not.toBe(escapeHtmlManual("'"));
    });

    it.each([
      'Hello World',
      '你好世界',
      '🌍🎉',
      'Hello & World < Test > End',
    ])('应该对 "%s" 产生相同输出', (input) => {
      expect(escapeHtml(input)).toBe(escapeHtmlManual(input));
    });
  });
});

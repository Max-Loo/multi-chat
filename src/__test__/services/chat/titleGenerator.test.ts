import { describe, it, expect } from 'vitest';

/**
 * titleGenerator 单元测试
 *
 * 注意：由于 Vitest 无法正确 mock Vercel AI SDK 的 generateText 函数，
 * 我们改为测试后处理逻辑（标点移除、长度截取），而不是完整的 API 调用流程。
 *
 * 完整的 API 调用测试已在集成测试中覆盖（auto-naming.integration.test.ts）。
 */

import { removePunctuation, truncateTitle } from '@/services/chat/titleGenerator';

describe('titleGenerator - 后处理逻辑', () => {
  describe('removePunctuation', () => {
    it('应该移除中文标点符号', () => {
      const input = 'TypeScript 学习方法。';
      const result = removePunctuation(input);
      expect(result).toBe('TypeScript 学习方法');
    });

    it('应该移除英文标点符号', () => {
      const input = 'React Tutorial!';
      const result = removePunctuation(input);
      expect(result).toBe('React Tutorial');
    });

    it('应该移除混合标点符号', () => {
      const input = 'AI 技术发展趋势，2024年！';
      const result = removePunctuation(input);
      expect(result).toBe('AI 技术发展趋势2024年');
    });

    it('应该保留数字和字母', () => {
      const input = 'Vue3 2024';
      const result = removePunctuation(input);
      expect(result).toBe('Vue3 2024');
    });

    it('应该处理空字符串', () => {
      const result = removePunctuation('');
      expect(result).toBe('');
    });

    it('应该移除特殊字符', () => {
      const input = 'TypeScript@#$%学习';
      const result = removePunctuation(input);
      expect(result).toBe('TypeScript学习');
    });
  });

  describe('truncateTitle', () => {
    it('应该保留短标题不变', () => {
      const input = 'AI 技术';
      const result = truncateTitle(input);
      expect(result).toBe('AI 技术');
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('应该截取超长标题', () => {
      const input = '这是一个超过十个汉字的非常长的标题需要被截断'; // 23 个字符
      const result = truncateTitle(input);
      expect(result).toBe('这是一个超过十个汉字'); // 前 10 个字符
      expect(result.length).toBe(10);
    });

    it('应该处理正好 10 个字的标题', () => {
      const input = '1234567890'; // 10 个字符
      const result = truncateTitle(input);
      expect(result).toBe('1234567890');
      expect(result.length).toBe(10);
    });

    it('应该处理空字符串', () => {
      const result = truncateTitle('');
      expect(result).toBe('');
    });

    it('应该处理包含空格的标题', () => {
      const input = 'TypeScript 学习方法与实践 ';
      const result = truncateTitle(input);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});

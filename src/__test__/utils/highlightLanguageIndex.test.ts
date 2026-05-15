/**
 * loadLanguageModule 单元测试
 *
 * 测试策略：Mock 动态 import 验证语言标识符到模块路径的映射正确性
 */

import { describe, it, expect, vi } from 'vitest';
import { loadLanguageModule } from '@/utils/highlightLanguageIndex';

// Mock 代表性语言模块，验证 import() 参数正确
vi.mock('highlight.js/lib/languages/javascript', () => ({ default: 'javascript' }));
vi.mock('highlight.js/lib/languages/python', () => ({ default: 'python' }));
vi.mock('highlight.js/lib/languages/elixir', () => ({ default: 'elixir' }));
vi.mock('highlight.js/lib/languages/plaintext', () => ({ default: 'plaintext' }));

describe('loadLanguageModule', () => {
  describe('已知语言路由', () => {
    it('应该加载预加载语言 javascript', async () => {
      const module = await loadLanguageModule('javascript');
      expect(module).toEqual({ default: 'javascript' });
    });

    it('应该加载预加载语言 python', async () => {
      const module = await loadLanguageModule('python');
      expect(module).toEqual({ default: 'python' });
    });

    it('应该加载可选语言 elixir', async () => {
      const module = await loadLanguageModule('elixir');
      expect(module).toEqual({ default: 'elixir' });
    });

    it('应该加载边缘语言 plaintext', async () => {
      const module = await loadLanguageModule('plaintext');
      expect(module).toEqual({ default: 'plaintext' });
    });
  });

  describe('未知语言抛错', () => {
    it('应该抛出包含语言标识符的 Error 当传入不支持的语言', async () => {
      await expect(loadLanguageModule('brainfuck')).rejects.toThrow('brainfuck');
    });

    it('应该抛出 Error 当传入空字符串', async () => {
      await expect(loadLanguageModule('')).rejects.toThrow('Unsupported language');
    });
  });
});

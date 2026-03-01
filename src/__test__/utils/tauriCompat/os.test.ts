import { describe, it, expect } from 'vitest';
import { locale } from '@/utils/tauriCompat/os';

/**
 * OS 兼容层测试套件
 *
 * 测试 src/utils/tauriCompat/os.ts 模块的功能
 * 覆盖 locale() 函数的核心场景
 */
describe('OS 兼容层', () => {
  describe('locale 函数', () => {
    it('应该导出 locale 函数', () => {
      expect(locale).toBeDefined();
      expect(typeof locale).toBe('function');
    });

    it('应该返回 Promise<string>', async () => {
      const result = locale();
      expect(result).toBeInstanceOf(Promise);
      
      const language = await result;
      expect(typeof language).toBe('string');
    });

    it('返回值格式应该符合 BCP 47 标准', async () => {
      const language = await locale();

      // BCP 47 格式通常是 language-COUNTRY 或 language
      expect(language).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    });

    it('应该支持异步调用', async () => {
      // 验证函数可以被多次调用
      const lang1 = await locale();
      const lang2 = await locale();

      expect(typeof lang1).toBe('string');
      expect(typeof lang2).toBe('string');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { locale } from '@/platform/os';

// 绕过 setup/mocks.ts 对 os 模块的全局 mock，测试真实实现
vi.unmock('@/platform/os');

/**
 * 平台语言服务测试套件
 *
 * 测试 src/platform/os.ts 模块的功能
 * 覆盖 locale() 函数的核心场景
 */
describe('平台语言服务', () => {
  describe('locale 函数', () => {
    it('返回值格式应该符合 BCP 47 标准', async () => {
      const language = await locale();

      // BCP 47 格式通常是 language-COUNTRY 或 language
      expect(language).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    });

    it('返回浏览器的 navigator.language 设置', async () => {
      const language = await locale();

      expect(language).toBe(navigator.language);
    });
  });
});

/**
 * platform/shell.ts 行为测试
 *
 * vi.unmock 绕过 setup/mocks.ts 的全局 mock，静态 import 获取真实模块
 * 测试覆盖 window.open 外链打开实现
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 绕过 setup/mocks.ts 对 shell 模块的全局 mock
vi.unmock('@/platform/shell');

import { shell } from '@/platform/shell';

describe('platform/shell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shell 外链打开', () => {
    it('open 调用 window.open 并传递新窗口参数', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      await shell.open('https://example.com');
      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      openSpy.mockRestore();
    });

    it('isSupported 返回 true（window.open 为浏览器标准能力）', () => {
      expect(shell.isSupported()).toBe(true);
    });
  });
});

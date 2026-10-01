/**
 * tauriCompat/shell.ts 测试
 *
 * vi.unmock 绕过 setup/mocks.ts 的全局 mock，静态 import 获取真实模块
 * 测试覆盖 WebShell 实现（window.open 外部链接打开）
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 绕过 setup/mocks.ts 对 shell 模块的全局 mock
vi.unmock('@/utils/tauriCompat/shell');

import { shell } from '@/utils/tauriCompat/shell';

describe('tauriCompat/shell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebShell', () => {
    it('open 调用 window.open', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      await shell.open('https://example.com');
      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      openSpy.mockRestore();
    });

    it('isSupported 在浏览器环境返回 true', () => {
      expect(shell.isSupported()).toBe(true);
    });
  });
});

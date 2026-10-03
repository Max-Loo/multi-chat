/**
 * platform/shell.ts 单元测试
 *
 * vi.unmock 绕过 setup/mocks.ts 的全局 mock，静态 import 获取真实模块
 * 测试覆盖真实的外部链接打开实现
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 绕过 setup/mocks.ts 对 shell 模块的全局 mock
vi.unmock('@/utils/platform/shell');

import { shell } from '@/utils/platform/shell';

describe('platform/shell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('外部链接打开', () => {
    it('open 调用 window.open 并使用安全参数', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      await shell.open('https://example.com');
      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      openSpy.mockRestore();
    });

    it('isSupported 返回 true', () => {
      expect(shell.isSupported()).toBe(true);
    });
  });
});

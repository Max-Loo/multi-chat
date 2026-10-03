/**
 * openExternal 外链打开测试
 *
 * 覆盖 window.open 调用参数（新标签页 + noopener）
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 绕过 setup/mocks.ts 对 openExternal 模块的全局 mock，测试真实模块
vi.unmock('@/utils/openExternal');

import { openExternal } from '@/utils/openExternal';

describe('openExternal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('使用 window.open 在新标签页打开 URL', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openExternal('https://example.com');

    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('传递带查询参数的 URL', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    openExternal('https://example.com?param1=value1&param2=value2');

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com?param1=value1&param2=value2',
      '_blank',
      'noopener,noreferrer'
    );
    openSpy.mockRestore();
  });
});

/**
 * fetchProvider 统一 fetch 测试
 *
 * 覆盖统一 fetch 导出、getFetchFunc 实例一致性和请求委托
 * 模块在加载时绑定 window.fetch，因此通过 vi.stubGlobal + 动态 import 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 移除 setup/mocks.ts 对 fetchProvider 模块的全局 mock，测试真实模块
vi.unmock('@/utils/fetchProvider');

describe('fetchProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  describe('绑定原生 fetch', () => {
    it('导出的 fetch 与 getFetchFunc() 是同一函数实例（均为加载时绑定的原生 fetch）', async () => {
      const provider = await import('@/utils/fetchProvider');

      expect(provider.getFetchFunc()).toBe(provider.fetch);
      expect(provider.getFetchFunc()).toBeTypeOf('function');
    });

    it('fetch 调用委托给原生 window.fetch 并转发参数', async () => {
      const mockResponse = new Response('test body');
      fetchMock.mockResolvedValue(mockResponse);

      const provider = await import('@/utils/fetchProvider');
      const result = await provider.fetch('https://example.com/api', { method: 'POST' });

      expect(fetchMock).toHaveBeenCalledWith('https://example.com/api', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });

    it('fetch 无 init 参数时透传 undefined', async () => {
      const mockResponse = new Response('ok');
      fetchMock.mockResolvedValue(mockResponse);

      const provider = await import('@/utils/fetchProvider');
      const result = await provider.fetch('https://example.com/api');

      expect(fetchMock).toHaveBeenCalledWith('https://example.com/api');
      expect(result).toBe(mockResponse);
    });

    it('getFetchFunc 返回的函数同样委托给原生 fetch', async () => {
      const mockResponse = new Response('via getFetchFunc');
      fetchMock.mockResolvedValue(mockResponse);

      const provider = await import('@/utils/fetchProvider');
      const result = await provider.getFetchFunc()('https://example.com/api');

      expect(fetchMock).toHaveBeenCalledWith('https://example.com/api');
      expect(result).toBe(mockResponse);
    });
  });
});

/**
 * platform/http.ts 原生 Web Fetch 测试
 *
 * 覆盖恒用原生 fetch 语义、实例一致性和请求委托
 * 使用 vi.stubGlobal + vi.resetModules + 动态 import 模式
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 移除 setup.ts 对 http 模块的全局 mock，使动态 import 获取真实模块
vi.unmock('@/platform/http');

describe('platform/http', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('恒用原生 Web Fetch', () => {
    it('fetch 使用原生 window.fetch 发起请求', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
      vi.stubGlobal('fetch', mockFetch);

      vi.resetModules();
      const http = await import('@/platform/http');

      await http.fetch('https://example.com/api');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/api');
    });

    it('getFetchFunc 返回的函数同样委托给原生 window.fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
      vi.stubGlobal('fetch', mockFetch);

      vi.resetModules();
      const http = await import('@/platform/http');

      const fetchFunc = http.getFetchFunc();
      await fetchFunc('https://example.com/api');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/api');
    });
  });

  describe('实例一致性', () => {
    it('导出的 fetch 与 getFetchFunc() 返回同一函数实例', async () => {
      vi.resetModules();
      const http = await import('@/platform/http');

      expect(http.getFetchFunc()).toBe(http.fetch);
    });

    it('getFetchFunc 多次调用返回同一实例', async () => {
      vi.resetModules();
      const http = await import('@/platform/http');

      const func1 = http.getFetchFunc();
      const func2 = http.getFetchFunc();

      expect(func1).toBe(func2);
      expect(func1).toBeTypeOf('function');
    });
  });

  describe('请求委托', () => {
    it('fetch 调用转发到 window.fetch 并透传参数与返回值', async () => {
      const mockResponse = new Response('test body');
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal('fetch', mockFetch);

      vi.resetModules();
      const http = await import('@/platform/http');

      const result = await http.fetch('https://example.com/api', { method: 'POST' });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });

    it('fetch 无 init 参数时单参数直通', async () => {
      const mockResponse = new Response('ok');
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal('fetch', mockFetch);

      vi.resetModules();
      const http = await import('@/platform/http');

      const result = await http.fetch('https://example.com/api');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/api');
      expect(result).toBe(mockResponse);
    });
  });
});

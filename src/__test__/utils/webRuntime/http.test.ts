/**
 * webRuntime/http.ts 单元测试
 *
 * 覆盖原生 fetch 薄封装的委托行为、实例一致性与 CORS 错误透传
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 移除 setup.ts 对 http 模块的全局 mock，使导入获取真实模块
vi.unmock('@/utils/webRuntime/http');

describe('webRuntime/http', () => {
  /** 保存原生 window.fetch，用于 after 恢复 */
  const originalFetch = window.fetch;
  /** 可控的 window.fetch mock */
  let mockWindowFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockWindowFetch = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<Response>>();
    window.fetch = mockWindowFetch as unknown as typeof window.fetch;
  });

  afterEach(() => {
    window.fetch = originalFetch;
    vi.resetModules();
  });

  describe('实例一致性', () => {
    it('getFetchFunc 多次调用返回同一实例', async () => {
      const http = await import('@/utils/webRuntime/http');

      const func1 = http.getFetchFunc();
      const func2 = http.getFetchFunc();

      expect(func1).toBe(func2);
      expect(func1).toBeTypeOf('function');
    });

    it('getFetchFunc 返回与导出 fetch 相同的函数实例', async () => {
      const http = await import('@/utils/webRuntime/http');

      expect(http.getFetchFunc()).toBe(http.fetch);
    });
  });

  describe('请求委托', () => {
    it('fetch 调用委托给 window.fetch 并转发参数与返回值', async () => {
      const mockResponse = new Response('test body');
      mockWindowFetch.mockResolvedValue(mockResponse);

      const http = await import('@/utils/webRuntime/http');

      const result = await http.fetch('https://example.com/api', { method: 'POST' });

      expect(mockWindowFetch).toHaveBeenCalledWith('https://example.com/api', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });

    it('fetch 无 init 参数时透传 undefined', async () => {
      const mockResponse = new Response('ok');
      mockWindowFetch.mockResolvedValue(mockResponse);

      const http = await import('@/utils/webRuntime/http');

      const result = await http.fetch('https://example.com/api');

      expect(mockWindowFetch).toHaveBeenCalledWith('https://example.com/api', undefined);
      expect(result).toBe(mockResponse);
    });

    it('getFetchFunc 获取的实例同样委托给 window.fetch', async () => {
      const mockResponse = new Response('via getFetchFunc');
      mockWindowFetch.mockResolvedValue(mockResponse);

      const http = await import('@/utils/webRuntime/http');
      const fetchFunc = http.getFetchFunc();

      const result = await fetchFunc(new URL('https://example.com/api'));

      expect(mockWindowFetch).toHaveBeenCalledWith(new URL('https://example.com/api'), undefined);
      expect(result).toBe(mockResponse);
    });
  });

  describe('错误透传（CORS 场景）', () => {
    it('window.fetch 以 TypeError reject 时错误向上透传，可被调用方捕获', async () => {
      // 浏览器 CORS 拦截表现为 fetch 以 TypeError reject
      mockWindowFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const http = await import('@/utils/webRuntime/http');

      await expect(http.fetch('https://cors-blocked.example.com/api')).rejects.toThrow(TypeError);
      await expect(http.fetch('https://cors-blocked.example.com/api')).rejects.toThrow('Failed to fetch');
    });
  });
});

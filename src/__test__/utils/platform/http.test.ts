/**
 * platform/http.ts 统一 fetch 测试
 *
 * 覆盖统一原生 Web fetch 实现、实例一致性和请求参数透传
 * 使用 vi.spyOn(window, 'fetch') + vi.resetModules + 动态 import 模式
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 移除 setup.ts 对 http 模块的全局 mock，使动态 import 获取真实模块
vi.unmock('@/utils/platform/http');

describe('platform/http', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(window, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('统一使用原生 Web Fetch', () => {
    it('开发环境调用 window.fetch', async () => {
      const mockResponse = new Response('dev');
      fetchSpy.mockResolvedValueOnce(mockResponse);

      vi.stubEnv('DEV', true);
      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const result = await http.fetch('https://example.com/api', { method: 'GET' });

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api', { method: 'GET' });
      expect(result).toBe(mockResponse);
    });

    it('生产环境同样调用 window.fetch，无环境分支', async () => {
      const mockResponse = new Response('prod');
      fetchSpy.mockResolvedValueOnce(mockResponse);

      vi.stubEnv('DEV', false);
      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const result = await http.fetch('https://example.com/api');

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api', undefined);
      expect(result).toBe(mockResponse);
    });
  });

  describe('实例一致性', () => {
    it('getFetchFunc 多次调用返回同一实例', async () => {
      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const func1 = http.getFetchFunc();
      const func2 = http.getFetchFunc();

      expect(func1).toBe(func2);
      expect(func1).toBeTypeOf('function');
    });

    it('getFetchFunc 返回的实例与 fetch 导出行为一致', async () => {
      const mockResponse = new Response('via getFetchFunc');
      fetchSpy.mockResolvedValueOnce(mockResponse);

      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const fetchFunc = http.getFetchFunc();
      const result = await fetchFunc('https://example.com/injected');

      // getFetchFunc 即原生 fetch 本体（绑定 window），单参调用按原样透传
      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/injected');
      expect(result).toBe(mockResponse);
    });
  });
});

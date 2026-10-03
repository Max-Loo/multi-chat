/**
 * platform/http.ts 纯 Web fetch 测试
 *
 * 覆盖统一 fetch 导出、getFetchFunc 实例一致性和请求委托
 * 模块在加载时绑定 window.fetch，因此请求委托用例在动态导入前替换原生引用
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 移除 setup.ts 对 http 模块的全局 mock，使用真实模块
vi.unmock('@/utils/platform/http');

describe('platform/http', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('统一 fetch 导出', () => {
    it('fetch 与 getFetchFunc() 返回同一函数实例', async () => {
      vi.resetModules();
      const http = await import('@/utils/platform/http');

      expect(http.fetch).toBeTypeOf('function');
      expect(http.getFetchFunc()).toBe(http.fetch);
    });

    it('getFetchFunc 多次调用返回同一实例', async () => {
      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const func1 = http.getFetchFunc();
      const func2 = http.getFetchFunc();

      expect(func1).toBe(func2);
      expect(func1).toBeTypeOf('function');
    });
  });

  describe('请求委托', () => {
    it('fetch 委托给原生 window.fetch 并转发参数与返回值', async () => {
      const mockResponse = new Response('test body');
      // 在模块（重新）加载前替换 window.fetch，使模块绑定的原生引用指向 spy
      const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse);

      vi.resetModules();
      const http = await import('@/utils/platform/http');
      const result = await http.fetch('https://example.com/api', { method: 'POST' });

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });

    it('fetch 无 init 参数时按单参数调用原生 fetch', async () => {
      const mockResponse = new Response('ok');
      const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse);

      vi.resetModules();
      const http = await import('@/utils/platform/http');
      const result = await http.fetch('https://example.com/api');

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api');
      expect(result).toBe(mockResponse);
    });
  });
});

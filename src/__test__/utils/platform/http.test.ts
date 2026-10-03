/**
 * platform/http.ts 单元测试
 *
 * 覆盖原生 fetch 绑定、实例一致性和请求委托
 * 使用 vi.stubGlobal + vi.resetModules + 动态 import 模式
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 创建可变的 mock 函数
const { mockNativeFetch } = vi.hoisted(() => ({
  mockNativeFetch: vi.fn<(input: unknown, init?: unknown) => Promise<Response>>(),
}));

// 移除 setup.ts 对 http 模块的全局 mock，使动态 import 获取真实模块
vi.unmock('@/utils/platform/http');

describe('platform/http', () => {
  beforeEach(() => {
    mockNativeFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('原生 fetch 绑定', () => {
    it('模块加载时绑定全局 fetch 并作为唯一实现', async () => {
      vi.stubGlobal('fetch', mockNativeFetch);

      vi.resetModules();
      const http = await import('@/utils/platform/http');

      expect(http.getFetchFunc()).toBeTypeOf('function');
      // 绑定发生在模块加载时，此后全局 fetch 的替换不影响已导出实例
      expect(mockNativeFetch).not.toHaveBeenCalled();
    });
  });

  describe('实例一致性', () => {
    it('getFetchFunc 多次调用返回同一实例', async () => {
      vi.stubGlobal('fetch', mockNativeFetch);

      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const func1 = http.getFetchFunc();
      const func2 = http.getFetchFunc();

      expect(func1).toBe(func2);
      expect(func1).toBeTypeOf('function');
    });
  });

  describe('请求委托', () => {
    it('fetch 调用委托给内部 _fetchInstance 并转发返回值', async () => {
      const mockResponse = new Response('test body');
      mockNativeFetch.mockResolvedValue(mockResponse);

      vi.stubGlobal('fetch', mockNativeFetch);

      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const result = await http.fetch('https://example.com/api', { method: 'POST' });

      expect(mockNativeFetch).toHaveBeenCalledWith('https://example.com/api', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });

    it('fetch 无 init 参数时透传 undefined', async () => {
      const mockResponse = new Response('ok');
      mockNativeFetch.mockResolvedValue(mockResponse);

      vi.stubGlobal('fetch', mockNativeFetch);

      vi.resetModules();
      const http = await import('@/utils/platform/http');

      const result = await http.fetch('https://example.com/api');

      expect(mockNativeFetch).toHaveBeenCalledWith('https://example.com/api', undefined);
      expect(result).toBe(mockResponse);
    });
  });
});

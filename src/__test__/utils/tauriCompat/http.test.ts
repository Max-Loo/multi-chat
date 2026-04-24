/**
 * tauriCompat/http.ts 跨平台 fetch 测试
 *
 * 覆盖 createFetch() 三路环境分支、降级路径、实例一致性和请求委托
 * 使用 vi.stubEnv + vi.resetModules + 动态 import 模式
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 创建可变的 mock 函数
const { mockIsTauri, mockTauriFetch } = vi.hoisted(() => ({
  mockIsTauri: vi.fn<() => boolean>(() => false),
  mockTauriFetch: vi.fn<(input: unknown, init?: unknown) => Promise<Response>>(),
}));

// 移除 setup.ts 对 http 模块的全局 mock，使动态 import 获取真实模块
vi.unmock('@/utils/tauriCompat/http');

// 覆盖 env 模块的 mock，使用可控的 mockIsTauri
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: mockIsTauri,
}));

describe('tauriCompat/http', () => {
  beforeEach(() => {
    mockIsTauri.mockReturnValue(false);
    mockTauriFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.doUnmock('@tauri-apps/plugin-http');
    vi.resetModules();
  });

  describe('三路环境分支', () => {
    it('DEV 环境使用原生 fetch，不导入插件', async () => {
      vi.stubEnv('DEV', true);
      mockIsTauri.mockReturnValue(false);

      vi.resetModules();
      const http = await import('@/utils/tauriCompat/http');

      // DEV 分支直接返回 originFetch，不检查 isTauri
      expect(http.getFetchFunc()).not.toBe(mockTauriFetch);
      expect(mockTauriFetch).not.toHaveBeenCalled();
    });

    it('生产 + Tauri 环境动态导入插件 fetch', async () => {
      vi.stubEnv('DEV', false);
      mockIsTauri.mockReturnValue(true);

      vi.doMock('@tauri-apps/plugin-http', () => ({
        fetch: mockTauriFetch,
      }));

      vi.resetModules();
      const http = await import('@/utils/tauriCompat/http');

      expect(http.getFetchFunc()).toBe(mockTauriFetch);
    });

    it('生产 + Tauri 插件导入失败降级到原生 fetch', async () => {
      vi.stubEnv('DEV', false);
      mockIsTauri.mockReturnValue(true);

      // 用抛出异常的工厂模拟插件导入失败
      vi.doMock('@tauri-apps/plugin-http', () => {
        throw new Error('Module not found: @tauri-apps/plugin-http');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.resetModules();
      const http = await import('@/utils/tauriCompat/http');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load Tauri fetch'),
        expect.any(Error),
      );

      // 降级到原生 fetch
      expect(http.getFetchFunc()).not.toBe(mockTauriFetch);
    });

    it('生产 + Web 环境使用原生 fetch', async () => {
      vi.stubEnv('DEV', false);
      mockIsTauri.mockReturnValue(false);

      vi.resetModules();
      const http = await import('@/utils/tauriCompat/http');

      expect(http.getFetchFunc()).not.toBe(mockTauriFetch);
      expect(mockTauriFetch).not.toHaveBeenCalled();
    });
  });

  describe('实例一致性', () => {
    it('getFetchFunc 多次调用返回同一实例', async () => {
      vi.stubEnv('DEV', true);
      mockIsTauri.mockReturnValue(false);

      vi.resetModules();
      const http = await import('@/utils/tauriCompat/http');

      const func1 = http.getFetchFunc();
      const func2 = http.getFetchFunc();

      expect(func1).toBe(func2);
    });
  });

  describe('请求委托', () => {
    it('fetch 调用委托给内部 _fetchInstance 并转发返回值', async () => {
      vi.stubEnv('DEV', false);
      mockIsTauri.mockReturnValue(true);

      const mockResponse = new Response('test body');
      mockTauriFetch.mockResolvedValue(mockResponse);

      vi.doMock('@tauri-apps/plugin-http', () => ({
        fetch: mockTauriFetch,
      }));

      vi.resetModules();
      const http = await import('@/utils/tauriCompat/http');

      const result = await http.fetch('https://example.com/api', { method: 'POST' });

      expect(mockTauriFetch).toHaveBeenCalledWith('https://example.com/api', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });
  });
});

/**
 * Store 插件 Mock 实现
 * 用于测试环境，提供与真实 API 一致的接口
 */

import { vi } from 'vitest';

/**
 * Store 兼容接口
 */
interface StoreCompat {
  init: () => Promise<void>;
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  keys: () => Promise<string[]>;
  save: () => Promise<void>;
  isSupported: () => boolean;
}

/**
 * Mock Store 类
 */
class MockStore implements StoreCompat {
  private data = new Map<string, unknown>();

  init = vi.fn().mockResolvedValue(undefined);

  get = vi.fn().mockImplementation(<T>(key: string): Promise<T | null> => {
    const value = this.data.get(key);
    return Promise.resolve((value as T | undefined) ?? null);
  });

  set = vi.fn().mockImplementation(async (key: string, value: unknown): Promise<void> => {
    this.data.set(key, value);
  });

  delete = vi.fn().mockImplementation(async (key: string): Promise<void> => {
    this.data.delete(key);
  });

  keys = vi.fn().mockImplementation((): Promise<string[]> => {
    return Promise.resolve(Array.from(this.data.keys()));
  });

  save = vi.fn().mockResolvedValue(undefined);

  isSupported = vi.fn().mockReturnValue(true);
}

/**
 * Mock createLazyStore 工厂函数
 */
export const createLazyStore = vi.fn(() => new MockStore());

/**
 * 导出 Store 兼容接口类型
 */
export type { StoreCompat };

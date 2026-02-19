/**
 * 存储模块 Mock 工厂
 * 
 * 提供统一的存储相关 Mock 创建函数
 */

import { vi } from 'vitest';
import type { StorageMocks } from './types';

/**
 * 创建存储模块 Mock
 * @returns 存储 Mock 对象
 */
export const createStorageMocks = (): StorageMocks => {
  // 模拟存储数据
  const mockStore: Map<string, unknown> = new Map();

  // 创建 Store 实例 Mock
  const createLazyStore = vi.fn().mockReturnValue({
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockStore.get(key) ?? null);
    }),
    set: vi.fn().mockImplementation((key: string, value: unknown) => {
      mockStore.set(key, value);
      return Promise.resolve();
    }),
    delete: vi.fn().mockImplementation((key: string) => {
      mockStore.delete(key);
      return Promise.resolve();
    }),
    keys: vi.fn().mockResolvedValue(Array.from(mockStore.keys())),
    save: vi.fn().mockResolvedValue(undefined),
    isSupported: vi.fn().mockReturnValue(true),
  });

  // 保存到 Store Mock
  const saveToStore = vi.fn().mockImplementation(
    async (_store: unknown, key: string, value: unknown) => {
      mockStore.set(key, value);
    }
  );

  // 从 Store 加载 Mock
  const loadFromStore = vi.fn().mockImplementation(async (_store: unknown, key: string) => {
    return mockStore.get(key) ?? [];
  });

  const allMocks = [createLazyStore, saveToStore, loadFromStore];

  return {
    createLazyStore,
    saveToStore,
    loadFromStore,

    /**
     * 重置所有 Mock
     */
    resetAll: () => {
      mockStore.clear();
      allMocks.forEach((mock) => {
        mock.mockClear();
        mock.mockReset();
      });
    },
  };
};

/**
 * Web 存储模块 Mock 工厂
 *
 * 提供统一的 vi.mock('@/utils/webStore') / vi.mock('@/utils/keyring') mock 创建函数，
 * 通过 globalThis.__createWebCompatModuleMock 注册。
 *
 * @example
 * ```ts
 * // 默认 mock
 * vi.mock('@/utils/webStore', () => globalThis.__createWebCompatModuleMock());
 *
 * // 带外部 memoryStore 的 mock
 * const memoryStore = new Map();
 * vi.mock('@/utils/webStore', () => globalThis.__createWebCompatModuleMock(memoryStore));
 * ```
 */

import { vi } from 'vitest';

/**
 * 创建 Web 存储相关模块的 mock 对象
 * @param storeMap 可选的外部 Map（用于测试中访问/清理数据）
 */
export function createWebCompatModuleMock(storeMap?: Map<string, unknown>) {
  return {
    createLazyStore: () => globalThis.__createMemoryStorageMock(storeMap),
    keyring: {
      getPassword: vi.fn(),
      setPassword: vi.fn(),
      deletePassword: vi.fn(),
      isSupported: vi.fn().mockReturnValue(true),
      resetState: vi.fn(),
    },
  };
}

/**
 * webStorage 模块 Mock 工厂
 *
 * 提供统一的 vi.mock('@/utils/webStorage') mock 创建函数，
 * 通过 globalThis.__createWebStorageModuleMock 注册。
 *
 * @example
 * ```ts
 * // 默认 mock
 * vi.mock('@/utils/webStorage', () => globalThis.__createWebStorageModuleMock());
 *
 * // 带外部 memoryStore 的 mock
 * const memoryStore = new Map();
 * vi.mock('@/utils/webStorage', () => globalThis.__createWebStorageModuleMock(memoryStore));
 * ```
 */

import { vi } from 'vitest';

/**
 * 创建完整的 vi.mock('@/utils/webStorage') 所需的 mock 对象
 * @param storeMap 可选的外部 Map（用于测试中访问/清理数据）
 */
export function createWebStorageModuleMock(storeMap?: Map<string, unknown>) {
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

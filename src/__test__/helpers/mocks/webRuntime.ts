/**
 * tauriCompat 模块 Mock 工厂
 *
 * 提供统一的 vi.mock('@/utils/tauriCompat') mock 创建函数，
 * 通过 globalThis.__createTauriCompatModuleMock 注册。
 *
 * @example
 * ```ts
 * // 默认 mock
 * vi.mock('@/utils/tauriCompat', () => globalThis.__createTauriCompatModuleMock());
 *
 * // 带外部 memoryStore 的 mock
 * const memoryStore = new Map();
 * vi.mock('@/utils/tauriCompat', () => globalThis.__createTauriCompatModuleMock(memoryStore));
 * ```
 */

import { vi } from 'vitest';

/**
 * 创建完整的 vi.mock('@/utils/tauriCompat') 所需的 mock 对象
 * @param storeMap 可选的外部 Map（用于测试中访问/清理数据）
 */
export function createTauriCompatModuleMock(storeMap?: Map<string, unknown>) {
  return {
    isTauri: () => false,
    createLazyStore: () => globalThis.__createMemoryStorageMock(storeMap),
    locale: async () => 'en-US',
    keyring: {
      getPassword: vi.fn(),
      setPassword: vi.fn(),
      deletePassword: vi.fn(),
      isSupported: vi.fn().mockReturnValue(true),
      resetState: vi.fn(),
    },
  };
}

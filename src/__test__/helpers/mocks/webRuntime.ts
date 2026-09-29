/**
 * webRuntime 模块 Mock 工厂
 *
 * 提供统一的 vi.mock('@/utils/webRuntime') mock 创建函数，
 * 通过 globalThis.__createWebRuntimeModuleMock 注册。
 *
 * @example
 * ```ts
 * // 默认 mock
 * vi.mock('@/utils/webRuntime', () => globalThis.__createWebRuntimeModuleMock());
 *
 * // 带外部 memoryStore 的 mock
 * const memoryStore = new Map();
 * vi.mock('@/utils/webRuntime', () => globalThis.__createWebRuntimeModuleMock(memoryStore));
 * ```
 */

import { vi } from 'vitest';

/**
 * 创建完整的 vi.mock('@/utils/webRuntime') 所需的 mock 对象
 * @param storeMap 可选的外部 Map（用于测试中访问/清理数据）
 */
export function createWebRuntimeModuleMock(storeMap?: Map<string, unknown>) {
  return {
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

/**
 * 存储模块 Mock 工厂
 *
 * 提供统一的存储相关 Mock 创建函数
 */

/**
 * 创建基于 Map 的内存存储 mock，供 vi.mock 工厂函数使用
 *
 * 通过 globalThis.__createMemoryStorageMock() 调用，返回真实读写行为的存储对象。
 * 与 vi.fn() 桩函数不同，此 mock 实际存储数据，适用于集成测试。
 *
 * @param storeMap 可选的外部 Map（用于测试中访问/清理数据）
 * @returns 模拟存储对象
 */
export function createMemoryStorageMock(storeMap?: Map<string, unknown>) {
  const map = storeMap ?? new Map<string, unknown>();
  return {
    init: async () => {},
    get: async <T>(key: string): Promise<T | null> => {
      const val = map.get(key);
      return val !== undefined ? (val as T) : null;
    },
    set: async (key: string, value: unknown) => {
      map.set(key, value);
    },
    delete: async (key: string) => {
      map.delete(key);
    },
    keys: async () => Array.from(map.keys()),
    save: async () => {},
    close: () => {},
    isSupported: () => true,
  };
}

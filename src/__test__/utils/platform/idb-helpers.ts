import { IDBFactory } from 'fake-indexeddb';
import { vi } from 'vitest';

/**
 * IndexedDB Mock 工具函数
 *
 * 使用 fake-indexeddb 库模拟 IndexedDB
 * 确保测试隔离和数据一致性
 */

/**
 * IndexedDB 测试上下文
 */
interface IDBTestContext {
  indexedDB: IDBFactory;
  cleanup: () => void;
}

/**
 * 初始化 Fake IndexedDB
 *
 * 创建内存中的 IndexedDB 实例，用于测试
 * 自动替换全局 indexedDB 对象
 *
 * @returns IndexedDB 测试上下文
 *
 * @example
 * ```ts
 * describe('Store 测试', () => {
 *   let ctx: IDBTestContext;
 *
 *   beforeEach(() => {
 *     ctx = initFakeIndexedDB();
 *   });
 *
 *   afterEach(() => {
 *     ctx.cleanup();
 *   });
 *
 *   it('应该存储数据', async () => {
 *     // 使用 ctx.indexedDB 进行测试
 *   });
 * });
 * ```
 */
export function initFakeIndexedDB(): IDBTestContext {
  // 创建 fake-indexeddb 实例
  const indexedDB = new IDBFactory();

  // 保存原始的 indexedDB
  const originalIndexedDB = globalThis.indexedDB;

  // 替换全局 indexedDB
  vi.stubGlobal('indexedDB', indexedDB);

  // 清理函数
  const cleanup = () => {
    // 恢复原始 indexedDB
    vi.unstubAllGlobals();

    // 如果有原始 indexedDB，则恢复它
    if (originalIndexedDB) {
      vi.stubGlobal('indexedDB', originalIndexedDB);
    }
  };

  return { indexedDB, cleanup };
}

/**
 * 清理 Fake IndexedDB
 *
 * 删除所有测试数据库并关闭连接
 * 通常在 afterEach 中调用
 *
 * @param ctx - IndexedDB 测试上下文
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   cleanupFakeIndexedDB(ctx);
 * });
 * ```
 */
export async function cleanupFakeIndexedDB(ctx: IDBTestContext): Promise<void> {
  // fake-indexeddb 不需要显式清理
  // 只需要调用上下文的 cleanup 函数
  ctx.cleanup();
}


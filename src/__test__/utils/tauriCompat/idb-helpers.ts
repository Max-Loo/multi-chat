import { IDBFactory } from 'fake-indexeddb';
import { afterEach, vi } from 'vitest';

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

/**
 * 创建测试数据库
 *
 * 辅助函数，用于快速创建一个测试数据库
 *
 * @param indexedDB - Fake IndexedDB 实例
 * @param databaseName - 数据库名称
 * @param storeNames - 对象存储名称数组
 * @param version - 数据库版本（默认 1）
 * @returns 数据库连接
 *
 * @example
 * ```ts
 * const db = await createTestDB(
 *   ctx.indexedDB,
 *   'test-db',
 *   ['store1', 'store2']
 * );
 * ```
 */
export async function createTestDB(
  indexedDB: IDBFactory,
  databaseName: string,
  storeNames: string[],
  version: number = 1
): Promise<IDBOpenDBRequest> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, version);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建所有对象存储
      storeNames.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };

    request.onsuccess = () => resolve(request);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 删除测试数据库
 *
 * 辅助函数，用于删除指定的测试数据库
 *
 * @param indexedDB - Fake IndexedDB 实例
 * @param databaseName - 数据库名称
 *
 * @example
 * ```ts
 * await deleteTestDB(ctx.indexedDB, 'test-db');
 * ```
 */
export async function deleteTestDB(
  indexedDB: IDBFactory,
  databaseName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 设置自动清理
 *
 * 配置 Vitest afterEach 钩子，自动清理 IndexedDB
 *
 * @param ctx - IndexedDB 测试上下文
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   const ctx = initFakeIndexedDB();
 *   setupAutoCleanup(ctx);
 * });
 * ```
 */
export function setupAutoCleanup(ctx: IDBTestContext): void {
  afterEach(() => {
    cleanupFakeIndexedDB(ctx);
  });
}

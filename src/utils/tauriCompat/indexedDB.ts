/**
 * IndexedDB 初始化公共模块
 * 提供统一的 IndexedDB 数据库连接初始化，支持复合键和单一键
 */

/**
 * 初始化 IndexedDB 数据库
 * @param {string} dbName - 数据库名称
 * @param {string} storeName - 对象存储名称
 * @param {string | string[]} keyPath - 主键路径，支持复合键和单一键
 * @returns {Promise<IDBDatabase>} IndexedDB 数据库实例
 */
export const initIndexedDB = async (
  dbName: string,
  storeName: string,
  keyPath: string | string[]
): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.addEventListener('error', () => {
      reject(new Error(`无法打开 IndexedDB 数据库: ${request.error}`));
    });

    request.addEventListener('success', () => {
      resolve(request.result);
    });

    request.addEventListener('upgradeneeded', (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath });
      }
    });
  });
};

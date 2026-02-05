/**
 * Tauri Store 插件兼容层
 * 提供统一的键值存储 API 封装，自动检测运行环境并选择合适的实现
 * 在 Tauri 环境使用原生实现，在 Web 环境使用 IndexedDB 实现
 */

import { LazyStore as TauriStore } from '@tauri-apps/plugin-store';
import { isTauri } from './env';

/**
 * IndexedDB 数据库名称和对象存储名称
 */
const DB_NAME = 'multi-chat-store';
const STORE_NAME = 'store';

/**
 * Store 兼容接口
 * 提供与 Tauri Store 一致的 API
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
 * 初始化 IndexedDB 数据库
 * @param {string} dbName - 数据库名称
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<IDBDatabase>} IndexedDB 数据库实例
 */
const initIndexedDB = async (dbName: string, storeName: string): Promise<IDBDatabase> => {
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
        db.createObjectStore(storeName, { keyPath: 'key' });
      }
    });
  });
};

/**
 * Tauri 环境的 Store 实现
 * 使用 @tauri-apps/plugin-store 的原生实现
 */
class TauriStoreCompat implements StoreCompat {
  private store: TauriStore;

  constructor(filename: string) {
    this.store = new TauriStore(filename, { autoSave: false, defaults: {} });
  }

  /**
   * 初始化 Store
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    await this.store.init();
  }

  /**
   * 获取键值
   * @param {string} key - 键名
   * @returns {Promise<T | null>} 值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.store.get<T>(key);
    return value ?? null;
  }

  /**
   * 设置键值
   * @param {string} key - 键名
   * @param {unknown} value - 值
   * @returns {Promise<void>}
   */
  async set(key: string, value: unknown): Promise<void> {
    await this.store.set(key, value);
  }

  /**
   * 删除键值
   * @param {string} key - 键名
   * @returns {Promise<void>}
   */
  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  /**
   * 获取所有键
   * @returns {Promise<string[]>} 键数组
   */
  async keys(): Promise<string[]> {
    return this.store.keys();
  }

  /**
   * 保存更改到磁盘
   * @returns {Promise<void>}
   */
  async save(): Promise<void> {
    await this.store.save();
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 在 Tauri 环境始终返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Web 环境的 Store 实现
 * 使用 IndexedDB 实现键值存储
 */
class WebStoreCompat implements StoreCompat {
  private db: IDBDatabase | null = null;

  // eslint-disable-next-line no-useless-constructor
  constructor(_filename: string) {
    // filename 参数保留以保持与 TauriStoreCompat 的接口一致性
    // Web 环境忽略此参数，使用固定的 IndexedDB 数据库名称
  }

  /**
   * 初始化 IndexedDB 数据库
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    try {
      this.db = await initIndexedDB(DB_NAME, STORE_NAME);
    } catch (error) {
      console.error('初始化 IndexedDB 失败:', error);
      throw new Error('浏览器不支持 IndexedDB 或初始化失败', { cause: error });
    }
  }

  /**
   * 确保数据库已初始化
   * @returns {IDBDatabase} IndexedDB 数据库实例
   */
  private ensureDb(): IDBDatabase {
    if (!this.db) {
      throw new Error('Store 未初始化，请先调用 init() 方法');
    }
    return this.db;
  }

  /**
   * 获取键值
   * @param {string} key - 键名
   * @returns {Promise<T | null>} 值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    const db = this.ensureDb();

    return new Promise<T | null>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(key);

      request.addEventListener('success', () => {
        const result = request.result;
        if (result && 'value' in result && result.value !== undefined) {
          resolve(result.value as T);
        } else {
          resolve(null);
        }
      });

      request.addEventListener('error', () => {
        console.error(`读取键 ${key} 失败:`, request.error);
        resolve(null);
      });
    });
  }

  /**
   * 设置键值
   * @param {string} key - 键名
   * @param {unknown} value - 值
   * @returns {Promise<void>}
   */
  async set(key: string, value: unknown): Promise<void> {
    const db = this.ensureDb();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put({ key, value });

      request.addEventListener('success', () => {
        resolve();
      });

      request.addEventListener('error', () => {
        reject(new Error(`写入键 ${key} 失败: ${request.error}`));
      });
    });
  }

  /**
   * 删除键值
   * @param {string} key - 键名
   * @returns {Promise<void>}
   */
  async delete(key: string): Promise<void> {
    const db = this.ensureDb();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(key);

      request.addEventListener('success', () => {
        resolve();
      });

      request.addEventListener('error', () => {
        reject(new Error(`删除键 ${key} 失败: ${request.error}`));
      });
    });
  }

  /**
   * 获取所有键
   * @returns {Promise<string[]>} 键数组
   */
  async keys(): Promise<string[]> {
    const db = this.ensureDb();

    return new Promise<string[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAllKeys();

      request.addEventListener('success', () => {
        resolve(request.result as string[]);
      });

      request.addEventListener('error', () => {
        reject(new Error(`获取所有键失败: ${request.error}`));
      });
    });
  }

  /**
   * 保存更改到磁盘
   * 在 Web 环境中，IndexedDB 自动提交事务，此方法为空操作
   * @returns {Promise<void>}
   */
  async save(): Promise<void> {
    // IndexedDB 自动持久化，无需手动保存
    return Promise.resolve();
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 如果浏览器支持 IndexedDB 返回 true
   */
  isSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}

/**
 * 创建 Store 实例的工厂函数
 * 根据运行环境自动选择合适的实现
 * 
 * @param {string} filename - 存储文件名（Tauri 环境使用，Web 环境忽略）
 * @returns {StoreCompat} Store 兼容接口实例
 * 
 * @example
 * ```typescript
 * import { createLazyStore } from '@/utils/tauriCompat';
 * 
 * const store = createLazyStore('models.json');
 * await store.init();
 * await store.set('models', modelList);
 * await store.save();
 * const models = await store.get<Model[]>('models');
 * ```
 */
export const createLazyStore = (filename: string): StoreCompat => {
  if (isTauri()) {
    return new TauriStoreCompat(filename);
  } else {
    return new WebStoreCompat(filename);
  }
};

/**
 * 导出 Store 兼容接口类型供外部使用
 */
export type { StoreCompat };

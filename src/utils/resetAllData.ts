/**
 * 全量数据重置模块
 * 清除安全基础设施和业务数据，保留应用配置
 */
import { keyring, SEED_STORAGE_KEY } from '@/utils/platform/keyring';
import { KEYRING_VERSION_KEY, KEYRING_DB_NAME, STORE_DB_NAME } from '@/utils/platform/keyringMigration';
import { SECURITY_WARNING_DISMISSED_KEY } from '@/store/keyring/masterKey';

/** 需要清除的 localStorage key（安全基础设施） */
const KEYRING_LOCAL_STORAGE_KEYS = [
  SEED_STORAGE_KEY,
  KEYRING_VERSION_KEY,
  SECURITY_WARNING_DISMISSED_KEY,
];

/** 需要删除的 IndexedDB 数据库名 */
const WEB_INDEXEDDB_DATABASES = [KEYRING_DB_NAME, STORE_DB_NAME];

/**
 * 清除 localStorage 中 keyring 相关的项
 * 保留应用偏好配置
 */
const clearKeyringLocalStorage = (): void => {
  for (const key of KEYRING_LOCAL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`清除 localStorage key "${key}" 失败:`, error);
    }
  }
};

/**
 * 删除 IndexedDB 数据库
 * @param dbName 数据库名称
 */
const deleteIndexedDB = async (dbName: string): Promise<void> => {
  try {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.addEventListener('success', () => resolve());
      request.addEventListener('error', () => {
        console.error(`删除 IndexedDB "${dbName}" 失败:`, request.error);
        resolve();
      });
      request.addEventListener('blocked', () => {
        console.warn(`删除 IndexedDB "${dbName}" 被阻塞，等待...`);
        setTimeout(() => resolve(), 1000);
      });
    });
  } catch (error) {
    console.error(`删除 IndexedDB "${dbName}" 异常:`, error);
  }
};

/**
 * 全量数据重置函数
 * 清除安全基础设施（keyring + seed）和业务数据（模型配置、聊天记录），保留应用偏好配置
 * 每个清理步骤独立 try-catch，不因部分失败中断整体流程
 */
export const resetAllData = async (): Promise<void> => {
  clearKeyringLocalStorage();

  await Promise.all(WEB_INDEXEDDB_DATABASES.map((dbName) => deleteIndexedDB(dbName)));

  keyring.resetState();
};

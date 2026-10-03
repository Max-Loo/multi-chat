/**
 * 纯 Web 存储模块统一导出
 * 提供基于 IndexedDB 的键值存储与加密密钥存储 API
 *
 * @example
 * ```typescript
 * // 导入 Store API
 * import { createLazyStore, type StoreCompat } from '@/utils/webStorage';
 *
 * // 导入 Keyring API
 * import { keyring, type KeyringPublicAPI } from '@/utils/webStorage';
 *
 * // 导入 Keyring 迁移模块
 * import { migrateKeyringV1ToV2, isMigrationToV2Complete } from '@/utils/webStorage';
 *
 * // 使用 Store API
 * const store = createLazyStore('models.json');
 * await store.init();
 * await store.set('models', modelList);
 * await store.save();
 * const models = await store.get<Model[]>('models');
 *
 * // 使用 Keyring API
 * if (keyring.isSupported()) {
 *   await keyring.setPassword('com.multichat.app', 'master-key', 'my-secret-key');
 *   const key = await keyring.getPassword('com.multichat.app', 'master-key');
 * }
 * ```
 */

// Store 键值存储
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// Keyring 安全存储
export { keyring, SEED_STORAGE_KEY } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';

// Keyring 迁移模块
export {
  migrateKeyringV1ToV2,
  isMigrationToV2Complete,
  KEYRING_VERSION_KEY,
  KEYRING_DB_NAME,
  STORE_DB_NAME,
} from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

// 环境与加密基础设施
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';
export { initIndexedDB } from './indexedDB';
export { encrypt, decrypt } from './crypto-helpers';
export type { PasswordRecord } from './crypto-helpers';

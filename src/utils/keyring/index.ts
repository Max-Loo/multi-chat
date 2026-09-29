/**
 * Web Keyring 安全存储模块统一导出
 * 提供基于 IndexedDB + AES-256-GCM 的密钥存储 API 与 V1 → V2 数据迁移
 *
 * @example
 * ```typescript
 * import { keyring } from '@/utils/keyring';
 * import type { KeyringPublicAPI } from '@/utils/keyring';
 *
 * if (keyring.isSupported()) {
 *   await keyring.setPassword('com.multichat.app', 'master-key', 'my-secret-key');
 *   const key = await keyring.getPassword('com.multichat.app', 'master-key');
 * }
 * ```
 */

// Keyring API（统一入口，仅导出受约束的 keyring 实例，不导出独立的转发函数）
export { keyring } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';
export { SEED_STORAGE_KEY } from './keyring';

// Keyring 迁移模块
export {
  migrateKeyringV1ToV2,
  isMigrationToV2Complete,
  KEYRING_VERSION_KEY,
  KEYRING_DB_NAME,
  STORE_DB_NAME,
} from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

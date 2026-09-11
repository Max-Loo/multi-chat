/**
 * 平台层统一导出
 * 提供基于 Web 标准 API 的平台能力封装
 *
 * @example
 * ```typescript
 * // 导入环境检测
 * import { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from '@/utils/platform';
 *
 * // 导入语言检测 API
 * import { locale } from '@/utils/platform';
 *
 * // 导入 HTTP API
 * import { fetch, getFetchFunc, type FetchFunc } from '@/utils/platform';
 *
 * // 导入 Store API
 * import { createLazyStore, type StoreCompat } from '@/utils/platform';
 *
 * // 导入 Keyring API
 * import { keyring, type KeyringPublicAPI } from '@/utils/platform';
 *
 * // 使用语言检测 API
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US"
 *
 * // 使用 HTTP API
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
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

// 环境检测
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';

// 语言检测
export { locale } from './os';

// HTTP 模块
export { fetch, getFetchFunc } from './http';
export type { FetchFunc } from './http';

// Store 模块
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// Keyring 模块
export { keyring } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';

// Keyring 迁移模块
export { migrateKeyringV1ToV2, isMigrationToV2Complete } from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

/**
 * 平台层统一导出
 * 提供浏览器平台能力的统一 API 封装
 *
 * @example
 * ```typescript
 * // 导入测试环境检测
 * import { isTestEnvironment } from '@/utils/platform';
 *
 * // 导入外部链接打开 API
 * import { shell } from '@/utils/platform';
 *
 * // 导入浏览器语言 API
 * import { locale } from '@/utils/platform';
 *
 * // 导入 HTTP API
 * import { fetch, getFetchFunc, type RequestInfo } from '@/utils/platform';
 *
 * // 导入 Store API
 * import { createLazyStore, type StoreCompat } from '@/utils/platform';
 *
 * // 导入 Keyring API
 * import { keyring, type KeyringPublicAPI } from '@/utils/platform';
 *
 * // 使用外部链接打开 API
 * await shell.open('https://example.com');
 *
 * // 使用浏览器语言 API
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

// 测试环境检测
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';

// 外部链接打开
export { shell } from './shell';

// 浏览器语言
export { locale } from './os';

// HTTP
export { fetch, getFetchFunc } from './http';
export type { RequestInfo, FetchFunc } from './http';

// Store
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// Keyring
export { keyring } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';

// Keyring 迁移模块
export { migrateKeyringV1ToV2, isMigrationToV2Complete } from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

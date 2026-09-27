/**
 * 平台服务层统一导出
 * 提供浏览器平台能力的统一封装（HTTP / Shell / 语言 / 键值存储 / 密钥存储）
 *
 * @example
 * ```typescript
 * // 导入环境检测
 * import { isTestEnvironment, getPBKDF2Iterations } from '@/platform';
 *
 * // 导入外链打开服务
 * import { shell } from '@/platform';
 *
 * // 导入语言服务
 * import { locale } from '@/platform';
 *
 * // 导入 HTTP 服务
 * import { fetch, getFetchFunc, type RequestInfo } from '@/platform';
 *
 * // 导入键值持久化服务
 * import { createLazyStore, type StoreCompat } from '@/platform';
 *
 * // 导入密钥存储服务
 * import { keyring, type KeyringPublicAPI } from '@/platform';
 *
 * // 使用语言服务
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US"
 *
 * // 使用外链打开服务
 * await shell.open('https://example.com');
 *
 * // 使用 HTTP 服务
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
 *
 * // 使用键值持久化服务
 * const store = createLazyStore('models.json');
 * await store.init();
 * await store.set('models', modelList);
 * await store.save();
 * const models = await store.get<Model[]>('models');
 *
 * // 使用密钥存储服务
 * if (keyring.isSupported()) {
 *   await keyring.setPassword('com.multichat.app', 'master-key', 'my-secret-key');
 *   const key = await keyring.getPassword('com.multichat.app', 'master-key');
 * }
 * ```
 */

// 环境检测
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';

// 外链打开服务
export { shell } from './shell';

// 语言服务
export { locale } from './os';

// HTTP 服务
export { fetch, getFetchFunc } from './http';
export type { RequestInfo, FetchFunc } from './http';

// 键值持久化服务
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// 密钥存储服务
export { keyring } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';

// Keyring 迁移模块
export { migrateKeyringV1ToV2, isMigrationToV2Complete } from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

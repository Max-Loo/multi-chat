/**
 * Web 运行时模块统一导出
 * 提供浏览器环境下的统一运行时 API
 *
 * @example
 * ```typescript
 * // 导入测试环境检测
 * import { isTestEnvironment } from '@/utils/webRuntime';
 *
 * // 导入 Shell 功能 API（Command 为 Null Object 实现）
 * import { Command, shell, type ChildProcess } from '@/utils/webRuntime';
 *
 * // 导入语言检测 API
 * import { locale } from '@/utils/webRuntime';
 *
 * // 导入 HTTP API
 * import { fetch, getFetchFunc, type RequestInfo } from '@/utils/webRuntime';
 *
 * // 导入 Store API
 * import { createLazyStore, type StoreCompat } from '@/utils/webRuntime';
 *
 * // 导入 Keyring API
 * import { keyring, type KeyringPublicAPI } from '@/utils/webRuntime';
 *
 * // 使用 OS API
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US"
 *
 * // 使用 Shell API
 * const cmd = Command.create('ls', ['-la']);
 * if (cmd.isSupported()) {
 *   const output = await cmd.execute();
 *   console.log(output.stdout);
 * }
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

// 环境检测与 PBKDF2 参数
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';

// Shell 功能运行时模块（Command 为 Null Object 实现）
export { Command, shell } from './shell';
export type { ChildProcess } from './shell';

// 浏览器语言检测模块
export { locale } from './os';

// HTTP 运行时模块
export { fetch, getFetchFunc } from './http';
export type { RequestInfo, FetchFunc } from './http';

// Store 键值存储运行时模块
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// Keyring 安全存储运行时模块
export { keyring } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';

// Keyring 迁移模块
export { migrateKeyringV1ToV2, isMigrationToV2Complete } from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

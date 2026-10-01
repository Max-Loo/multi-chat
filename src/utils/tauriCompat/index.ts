/**
 * Web 平台工具模块统一导出
 * 提供浏览器环境下的平台能力封装（历史名称 tauriCompat 保留以减少路径变更）
 *
 * @example
 * ```typescript
 * // 导入环境检测
 * import { isTestEnvironment } from '@/utils/tauriCompat';
 *
 * // 导入外部链接打开 API
 * import { shell } from '@/utils/tauriCompat';
 *
 * // 导入 OS API
 * import { locale } from '@/utils/tauriCompat';
 *
 * // 导入 Store API
 * import { createLazyStore, type StoreCompat } from '@/utils/tauriCompat';
 *
 * // 导入 Keyring API
 * import { keyring, type KeyringPublicAPI } from '@/utils/tauriCompat';
 *
 * // 使用外部链接打开 API
 * await shell.open('https://example.com');
 *
 * // 使用 OS API
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US"
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

// 环境检测（仅测试环境检测，用于密钥派生迭代次数选择）
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';

// 外部链接打开模块
export { shell } from './shell';

// OS 模块（语言检测）
export { locale } from './os';

// Store 模块
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// Keyring 模块
export { keyring } from './keyring';
export type { KeyringPublicAPI, KeyringCompat } from './keyring';

// Keyring 迁移模块
export { migrateKeyringV1ToV2, isMigrationToV2Complete } from './keyringMigration';
export type { MigrationResult } from './keyringMigration';

/**
 * Web 共享工具模块统一导出
 * 提供 keyring 与 webStore 共用的 IndexedDB 初始化、加密辅助函数与环境检测
 *
 * @example
 * ```typescript
 * import { initIndexedDB, encrypt, decrypt } from '@/utils/webCommon';
 * import type { PasswordRecord } from '@/utils/webCommon';
 * ```
 */

// IndexedDB 初始化
export { initIndexedDB } from './indexedDB';

// 加密辅助函数
export { encrypt, decrypt } from './crypto-helpers';
export type { PasswordRecord } from './crypto-helpers';

// 环境检测
export { isTestEnvironment, getPBKDF2Iterations, PBKDF2_ALGORITHM, DERIVED_KEY_LENGTH } from './env';

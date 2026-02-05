/**
 * Tauri 插件兼容层统一导出
 * 提供跨平台兼容的 Tauri 插件 API 封装
 *
 * @example
 * ```typescript
 * // 导入环境检测
 * import { isTauri } from '@/utils/tauriCompat';
 *
 * // 导入 Shell 插件 API
 * import { Command, shell } from '@/utils/tauriCompat';
 *
 * // 导入 OS 插件 API
 * import { locale } from '@/utils/tauriCompat';
 *
 * // 导入 HTTP 插件 API
 * import { fetch, getFetchFunc, type RequestInfo } from '@/utils/tauriCompat';
 *
 * // 导入 Store 插件 API
 * import { createLazyStore, type StoreCompat } from '@/utils/tauriCompat';
 *
 * // 导入 Keyring 插件 API
 * import { setPassword, getPassword, deletePassword, isKeyringSupported } from '@/utils/tauriCompat';
 *
 * if (isTauri()) {
 *   console.log('运行在 Tauri 桌面环境');
 * } else {
 *   console.log('运行在 Web 浏览器环境');
 * }
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
 * await setPassword('com.multichat.app', 'master-key', 'my-secret-key');
 * const key = await getPassword('com.multichat.app', 'master-key');
 * ```
 */

// 环境检测
export { isTauri } from './env';

// Shell 插件兼容层
export { Command, shell } from './shell';

// OS 插件兼容层
export { locale } from './os';

// HTTP 插件兼容层
export { fetch, getFetchFunc } from './http';
export type { RequestInfo, FetchFunc } from './http';

// Store 插件兼容层
export { createLazyStore } from './store';
export type { StoreCompat } from './store';

// Keyring 插件兼容层
export { setPassword, getPassword, deletePassword, isKeyringSupported } from './keyring';
export type { KeyringCompat } from './keyring';

// 重新导出 Tauri 类型供外部使用
export type { ChildProcess } from '@tauri-apps/plugin-shell';

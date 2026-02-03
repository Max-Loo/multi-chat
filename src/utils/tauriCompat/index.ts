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
 * ```
 */

// 环境检测
export { isTauri } from './env';

// Shell 插件兼容层
export { Command, shell } from './shell';

// OS 插件兼容层
export { locale } from './os';

// 重新导出 Tauri 类型供外部使用
export type { ChildProcess } from '@tauri-apps/plugin-shell';

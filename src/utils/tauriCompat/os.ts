/**
 * Tauri OS 插件兼容层
 * 提供统一的 OS API 封装，自动检测运行环境并选择合适的实现
 * 在 Tauri 环境使用原生实现，在 Web 环境使用浏览器降级实现
 */

import { locale as tauriLocale } from '@tauri-apps/plugin-os';
import { isTauri } from './env';

/**
 * 获取系统或浏览器的语言设置
 *
 * 在 Tauri 环境中，返回操作系统的语言设置
 * 在 Web 环境中，返回浏览器的首选语言设置
 *
 * @returns {Promise<string>} BCP 47 语言标签（如 "zh-CN"、"en-US"）
 *
 * @example
 * ```typescript
 * import { locale } from '@/utils/tauriCompat';
 *
 * const language = await locale();
 * console.log(language); // "zh-CN" 或 "en-US" 等
 * ```
 */
export const locale = async (): Promise<string> => {
  if (isTauri()) {
    // Tauri 环境：调用原生 API 获取系统语言
    const result = await tauriLocale();
    return result || navigator.language;
  } else {
    // Web 环境：使用浏览器语言设置作为降级实现
    return navigator.language;
  }
};

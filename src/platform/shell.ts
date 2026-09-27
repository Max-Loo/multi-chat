/**
 * 平台外链打开服务
 * 提供统一的外部 URL 打开能力，使用浏览器原生 window.open 实现
 */

/**
 * Shell 服务接口
 */
interface ShellCompat {
  open: (path: string) => Promise<void>;
  isSupported: () => boolean;
}

/**
 * Shell 服务实例
 * 使用浏览器原生 API 打开 URL
 *
 * @example
 * ```typescript
 * import { shell } from '@/platform';
 *
 * // 使用 window.open 打开 URL
 * await shell.open('https://example.com');
 * ```
 */
export const shell: ShellCompat = {
  /**
   * 使用浏览器原生 API 打开 URL
   * @param {string} path - 要打开的 URL 或路径
   * @returns {Promise<void>}
   */
  async open(path: string): Promise<void> {
    // 使用浏览器原生 API 打开 URL
    // 注意：只能打开 URL，无法打开本地文件路径
    window.open(path, '_blank', 'noopener,noreferrer');
  },

  /**
   * 检查功能是否可用
   * @returns {boolean} 始终返回 true（window.open 为浏览器标准能力）
   */
  isSupported(): boolean {
    return true;
  },
};

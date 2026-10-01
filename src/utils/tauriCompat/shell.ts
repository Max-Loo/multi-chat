/**
 * 外部链接打开模块
 * 使用浏览器原生 API（window.open）在新标签页打开外部 URL
 */

/**
 * Shell 对象兼容接口
 */
interface ShellCompat {
  open: (path: string) => Promise<void>;
  isSupported: () => boolean;
}

/**
 * Web 环境的 Shell 实现
 * 对于 URL 打开，提供浏览器原生方案
 */
class WebShell implements ShellCompat {
  /**
   * 使用浏览器原生 API 打开 URL
   * @param {string} path - 要打开的 URL 或路径
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // 使用 window.open 在新标签页打开 URL
   * await shell.open('https://example.com');
   * ```
   */
  async open(path: string): Promise<void> {
    // 使用浏览器原生 API 打开 URL
    // 注意：只能打开 URL，无法打开本地文件路径
    window.open(path, '_blank', 'noopener,noreferrer');
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 浏览器环境提供 window.open，返回 true
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.open === 'function';
  }
}

/**
 * Shell 对象实例
 */
export const shell: ShellCompat = new WebShell();

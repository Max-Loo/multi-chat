/**
 * 平台层外部链接打开模块
 * 使用浏览器原生 window.open 以新标签页打开 URL
 */

/**
 * Shell 对象兼容接口
 */
interface ShellCompat {
  open: (path: string) => Promise<void>;
  isSupported: () => boolean;
}

/**
 * 外部链接打开实现
 * 使用浏览器原生 API 打开 URL
 */
class BrowserShell implements ShellCompat {
  /**
   * 使用浏览器原生 API 以新标签页打开 URL
   * @param {string} path - 要打开的 URL
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await shell.open('https://example.com');
   * ```
   */
  async open(path: string): Promise<void> {
    // 使用 noopener,noreferrer 防止新页面对本页面的访问与引用泄露
    // 注意：只能打开 URL，无法打开本地文件路径
    window.open(path, '_blank', 'noopener,noreferrer');
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 使用浏览器原生 API，始终返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Shell 对象实例
 * 外部链接打开 API 的统一入口
 */
export const shell: ShellCompat = new BrowserShell();

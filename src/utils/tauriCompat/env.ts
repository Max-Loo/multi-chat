/**
 * Tauri 环境检测工具模块
 * 提供运行时环境检测功能，用于判断当前是否在 Tauri 桌面环境
 */

/**
 * 检测当前运行环境是否为 Tauri 桌面环境
 * 通过检测 window.__TAURI__ 对象的存在性来判断
 * 
 * @returns {boolean} 如果当前在 Tauri 环境返回 true，否则返回 false
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

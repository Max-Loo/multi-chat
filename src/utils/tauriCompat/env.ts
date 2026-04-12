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

/**
 * PBKDF2 密钥派生参数
 */
export const PBKDF2_ALGORITHM = 'SHA-256';
export const DERIVED_KEY_LENGTH = 256; // bits

/**
 * 检测是否在测试环境中运行
 * 使用多种方式检测以提高可靠性
 */
export const isTestEnvironment = (): boolean => {
  if (typeof (globalThis as Record<string, unknown>).vitest !== 'undefined') {
    return true;
  }
  if ((globalThis as Record<string, unknown>).__VITEST__) {
    return true;
  }
  if (typeof process !== 'undefined' && process.env?.VITEST) {
    return true;
  }
  try {
    const env = (import.meta as unknown as Record<string, unknown>).env as Record<string, unknown> | undefined;
    if (env?.VITEST === 'true') {
      return true;
    }
  } catch {
    // 忽略错误，继续检测其他方式
  }
  return false;
};

/**
 * 模块级缓存：环境检测结果在进程生命周期内固定不变
 */
const _isTestEnv = isTestEnvironment();

/**
 * 获取 PBKDF2 迭代次数
 * 在测试环境中使用更低的值以加快测试速度
 */
export const getPBKDF2Iterations = (): number =>
  _isTestEnv ? 1000 : 100000;

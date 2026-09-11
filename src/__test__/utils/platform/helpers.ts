import { vi } from 'vitest';

/**
 * 测试辅助工具函数
 *
 * 提供统一的 Mock 函数，用于模拟 Tauri 和 Web 环境
 * 确保测试的一致性和可维护性
 */

/**
 * Mock Tauri 环境
 *
 * 设置全局 window.__TAURI__ 对象，模拟 Tauri 桌面环境
 *
 * @example
 * ```ts
 * mockTauriEnvironment();
 * // 测试代码...
 * resetGlobals();
 * ```
 */
/**
 * 重置所有全局对象
 *
 * 恢复所有被 stub 的全局对象到原始状态
 * 应该在每个测试结束后调用
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetGlobals();
 * });
 * ```
 */
export function resetGlobals(): void {
  vi.unstubAllGlobals();
}

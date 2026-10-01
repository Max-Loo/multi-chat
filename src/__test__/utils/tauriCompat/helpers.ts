import { vi } from 'vitest';

/**
 * 测试辅助工具函数
 *
 * 提供全局对象 stub 的重置工具，确保测试的一致性和可维护性
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

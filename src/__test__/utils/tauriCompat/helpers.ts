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
export function mockTauriEnvironment(): void {
  vi.stubGlobal('window', {
    __TAURI__: {
      core: {},
    },
  });
}

/**
 * Mock Web 环境
 *
 * 移除 window.__TAURI__ 对象，模拟 Web 浏览器环境
 *
 * @example
 * ```ts
 * mockWebEnvironment();
 * // 测试代码...
 * resetGlobals();
 * ```
 */
export function mockWebEnvironment(): void {
  vi.stubGlobal('window', {});
}

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

/**
 * Mock 浏览器 navigator 对象
 *
 * @param properties - navigator 对象的属性
 *
 * @example
 * ```ts
 * mockNavigator({ language: 'zh-CN' });
 * resetGlobals();
 * ```
 */
export function mockNavigator(properties: Partial<Navigator>): void {
  vi.stubGlobal('navigator', properties);
}

/**
 * Mock console 输出
 *
 * 用于测试日志输出
 *
 * @param method - console 方法名称（log、error、warn 等）
 * @returns Mock 函数和 spy 对象
 *
 * @example
 * ```ts
 * const { mock, spy } = mockConsole('log');
 * console.log('test');
 * expect(spy).toHaveBeenCalledWith('test');
 * spy.mockRestore();
 * ```
 */
export function mockConsole(
  method: 'log' | 'error' | 'warn' | 'info'
): { mock: ReturnType<typeof vi.spyOn>; spy: ReturnType<typeof vi.spyOn> } {
  const spy = vi.spyOn(console, method).mockImplementation(() => {
    // 静默输出
  });
  return { mock: spy, spy };
}

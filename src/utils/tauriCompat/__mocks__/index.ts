/**
 * Mock 工具模块
 * 
 * 为 `@/utils/tauriCompat` 提供测试 Mock，隔离 Keyring 依赖。
 * 
 * 使用方法:
 * ```typescript
 * vi.mock("@/utils/tauriCompat", () => ({
 *   getPassword: vi.fn(),
 *   setPassword: vi.fn(),
 *   isTauri: vi.fn(),
 * }));
 * 
 * // 在测试中使用
 * vi.mocked(getPassword).mockResolvedValue("mock-key");
 * vi.mocked(setPassword).mockResolvedValue(undefined);
 * vi.mocked(isTauri).mockReturnValue(true);
 * ```
 */

import { vi } from "vitest";

/**
 * Mock getPassword 函数
 * 
 * @returns Promise<string | null> - 返回密码或 null
 * 
 * 使用方式:
 * - `mockResolvedValue("key")` - 模拟成功获取密码
 * - `mockResolvedValue(null)` - 模拟密码不存在
 * - `mockRejectedValue(new Error("error"))` - 模拟 Keyring 错误
 */
export const getPassword = vi.fn<(serviceName: string, account: string) => Promise<string | null>>();

/**
 * Mock setPassword 函数
 * 
 * @returns Promise<void>
 * 
 * 使用方式:
 * - `mockResolvedValue(undefined)` - 模拟成功存储密码
 * - `mockRejectedValue(new Error("error"))` - 模拟 Keyring 错误
 */
export const setPassword = vi.fn<(serviceName: string, account: string, password: string) => Promise<void>>();

/**
 * Mock isTauri 函数
 * 
 * @returns boolean - 是否为 Tauri 环境
 * 
 * 使用方式:
 * - `mockReturnValue(true)` - 模拟 Tauri 环境
 * - `mockReturnValue(false)` - 模拟 Web 环境
 */
export const isTauri = vi.fn<() => boolean>();

/**
 * 重置所有 Mock 函数的状态
 * 
 * 在 `beforeEach` 中调用，确保每个测试用例独立执行。
 */
export function resetMocks() {
  getPassword.mockReset();
  setPassword.mockReset();
  isTauri.mockReset();
}

/**
 * 清除所有 Mock 函数的 Mock 配置
 * 
 * 在 `afterEach` 中调用，恢复为未 Mock 状态。
 */
export function clearMocks() {
  getPassword.mockClear();
  setPassword.mockClear();
  isTauri.mockClear();
}

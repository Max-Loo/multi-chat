/**
 * sonner toast 模块 Mock 工厂
 *
 * 同构 mock 模板收敛入口：提供默认 success/error vi.fn() 的 toast mock。
 */

import { vi } from 'vitest';

/**
 * 创建 sonner 模块 mock
 *
 * 默认提供 success/error/warning/info 四个 vi.fn()（覆盖现有测试用到的全部方法）。
 * @returns 含 toast 的模块 mock
 */
export const createSonnerToastModuleMock = () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
});

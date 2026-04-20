/**
 * Toast Mock 工厂
 *
 * 提供 toastQueue 的统一 Mock 创建函数，避免各测试文件重复定义
 *
 * 使用方式：
 * - 方式 1（vi.mock 场景）：createToastQueueMocks() 生成 mock 对象，传给 vi.mock
 * - 方式 2（spyOn 场景）：在 beforeEach 中使用 createToastSpies(toastQueue)
 */

import { vi } from 'vitest';

/**
 * toastQueue 方法名列表
 */
const TOAST_METHODS = ['success', 'error', 'warning', 'info', 'loading', 'dismiss'] as const;
type ToastMethod = (typeof TOAST_METHODS)[number];

/**
 * 创建 toastQueue mock 对象（用于 vi.mock 回调）
 *
 * @example
 * ```ts
 * const mockToast = createToastQueueMocks();
 * vi.mock('@/services/toast', () => ({ toastQueue: mockToast }));
 * ```
 */
export function createToastQueueMocks(): Record<ToastMethod, ReturnType<typeof vi.fn>> {
  const mock = {} as Record<ToastMethod, ReturnType<typeof vi.fn>>;
  for (const method of TOAST_METHODS) {
    mock[method] = vi.fn(async () => 'toast-id');
  }
  return mock;
}

/**
 * 为 toastQueue 实例创建 spyOn mock（用于 beforeEach）
 *
 * @param target 真实的 toastQueue 实例
 * @returns 各方法的 spy 对象
 *
 * @example
 * ```ts
 * import { toastQueue } from '@/services/toast';
 * import { createToastSpies } from '@/__test__/helpers/mocks/toast';
 *
 * beforeEach(() => {
 *   createToastSpies(toastQueue);
 * });
 * ```
 */
export function createToastSpies(target: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in ToastMethod]: (...args: any[]) => any;
}): Record<ToastMethod, ReturnType<typeof vi.fn>> {
  const spies = {} as Record<ToastMethod, ReturnType<typeof vi.fn>>;
  for (const method of TOAST_METHODS) {
    spies[method] = vi.spyOn(target, method).mockImplementation(vi.fn());
  }
  return spies;
}

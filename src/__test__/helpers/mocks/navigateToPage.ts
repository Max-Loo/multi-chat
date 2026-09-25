/**
 * useNavigateToPage 模块共享 Mock
 *
 * 收敛各测试文件重复的 useNavigateToChat mock 模板。
 * 需要断言导航调用的测试直接 import mockNavigateToChat / mockClearChatIdParam 共享实例；
 * 纯默认场景仅保留 vi.mock 单行引用。
 */

import { vi } from 'vitest';

/** 共享的 navigateToChat mock 实例 */
export const mockNavigateToChat = vi.fn();

/** 共享的 clearChatIdParam mock 实例 */
export const mockClearChatIdParam = vi.fn();

/**
 * 创建 useNavigateToPage 模块 mock（供 vi.mock 工厂返回）
 * @returns 模块 mock 对象
 */
export function createNavigateToPageMock() {
  return {
    useNavigateToChat: vi.fn(() => ({
      navigateToChat: mockNavigateToChat,
      clearChatIdParam: mockClearChatIdParam,
    })),
  };
}

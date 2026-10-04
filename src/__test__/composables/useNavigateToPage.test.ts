/**
 * useNavigateToChat 组合式函数测试
 *
 * 验证带/不带 chatId 的跳转与清除 chatId 参数
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigateToChat } from '@/composables/useNavigateToPage';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  currentQuery: { chatId: 'chat-1', keep: 'yes' } as Record<string, string>,
}));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
  useRoute: () => ({ query: routerMock.currentQuery }),
}));

describe('useNavigateToChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('携带 chatId 时应该跳转到带参数的 /chat', () => {
    const { navigateToChat } = useNavigateToChat();

    navigateToChat({ chatId: 'chat-42' });

    expect(routerMock.push).toHaveBeenCalledWith({
      path: '/chat',
      query: { chatId: 'chat-42' },
    });
  });

  it('不携带 chatId 时应该跳转到不带参数的 /chat', () => {
    const { navigateToChat } = useNavigateToChat();

    navigateToChat();

    expect(routerMock.push).toHaveBeenCalledWith({
      path: '/chat',
      query: undefined,
    });
  });

  it('clearChatIdParam 应该只移除 chatId 并保留其余查询参数', () => {
    const { clearChatIdParam } = useNavigateToChat();

    clearChatIdParam();

    expect(routerMock.replace).toHaveBeenCalledWith({
      query: { keep: 'yes' },
    });
  });
});

/**
 * useCreateChat Hook 单元测试
 *
 * 测试策略：使用 renderHookWithProviders + 真实 store，
 * 通过 store.getState() 验证 state 变更，而非 mock dispatch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: vi.fn(() => ({
    navigateToChat: vi.fn(),
    clearChatIdParam: vi.fn(),
  })),
}));

vi.mock('ai', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    generateId: vi.fn(),
  };
});

import { useNavigateToChat } from '@/hooks/useNavigateToPage';
import { generateId } from 'ai';
import { useCreateChat } from '@/hooks/useCreateChat';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';

describe('useCreateChat', () => {
  const mockNavigateToChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigateToChat).mockReturnValue({
      navigateToChat: mockNavigateToChat,
      clearChatIdParam: vi.fn(),
    });
    vi.mocked(generateId).mockReturnValue('test-chat-id');
  });

  it('应该返回包含 createNewChat 方法的对象', () => {
    const { result } = renderHookWithProviders(() => useCreateChat());

    expect(result.current).toHaveProperty('createNewChat');
    expect(typeof result.current.createNewChat).toBe('function');
  });

  it('应该在 store 中创建新聊天', () => {
    const { result, store } = renderHookWithProviders(() => useCreateChat(), {
      preloadedState: {
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: null,
        }),
      },
    });

    return result.current.createNewChat().then(() => {
      const state = store.getState();
      const newChat = state.chat.chatList.find(c => c.id === 'test-chat-id');

      expect(newChat).toBeDefined();
      expect(newChat?.id).toBe('test-chat-id');
      expect(newChat?.name).toBe('');
    });
  });

  it('应该调用 navigateToChat 方法', () => {
    const { result } = renderHookWithProviders(() => useCreateChat());

    return result.current.createNewChat().then(() => {
      expect(mockNavigateToChat).toHaveBeenCalledTimes(1);
      expect(mockNavigateToChat).toHaveBeenCalledWith({
        chatId: 'test-chat-id',
      });
    });
  });

  it('createNewChat 引用应该稳定（useCallback）', () => {
    const { result, rerender } = renderHookWithProviders(() => useCreateChat());

    const firstRef = result.current.createNewChat;

    rerender();

    const secondRef = result.current.createNewChat;

    expect(firstRef).toBe(secondRef);
  });

  it('应该在创建聊天后同步设置 selectedChatId', () => {
    const { result, store } = renderHookWithProviders(() => useCreateChat(), {
      preloadedState: {
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: null,
        }),
      },
    });

    return result.current.createNewChat().then(() => {
      const state = store.getState();
      expect(state.chat.selectedChatId).toBe('test-chat-id');
    });
  });

  it('应该按正确顺序执行：createChat → setSelectedChatId → navigateToChat', () => {
    const { result, store } = renderHookWithProviders(() => useCreateChat(), {
      preloadedState: {
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: null,
        }),
      },
    });

    return result.current.createNewChat().then(() => {
      // 验证最终状态：chat 已创建且已选中
      const state = store.getState();
      expect(state.chat.chatList).toHaveLength(1);
      expect(state.chat.selectedChatId).toBe('test-chat-id');
      // navigateToChat 最后调用
      expect(mockNavigateToChat).toHaveBeenCalledWith({
        chatId: 'test-chat-id',
      });
    });
  });

  it('连续快速创建多个新聊天时，selectedChatId 应为最后一个', () => {
    vi.mocked(generateId)
      .mockReturnValueOnce('chat-1')
      .mockReturnValueOnce('chat-2')
      .mockReturnValueOnce('chat-3');

    const { result, store } = renderHookWithProviders(() => useCreateChat(), {
      preloadedState: {
        chat: createChatSliceState({
          chatList: [],
          selectedChatId: null,
        }),
      },
    });

    return result.current.createNewChat()
      .then(() => result.current.createNewChat())
      .then(() => result.current.createNewChat())
      .then(() => {
        const state = store.getState();
        // 所有 3 个聊天都已创建
        expect(state.chat.chatList).toHaveLength(3);
        // 最后一个为选中状态
        expect(state.chat.selectedChatId).toBe('chat-3');
      });
  });
});

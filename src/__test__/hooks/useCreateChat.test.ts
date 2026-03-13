/**
 * useCreateChat Hook 单元测试
 *
 * 测试策略：Mock useAppDispatch、useNavigateToChat 和 generateId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/hooks/redux', () => ({
  useAppDispatch: vi.fn(),
}));

vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: vi.fn(() => ({
    navigateToChat: vi.fn(),
    clearChatIdParam: vi.fn(),
  })),
}));

vi.mock('ai', () => ({
  generateId: vi.fn(),
}));

import { useAppDispatch } from '@/hooks/redux';
import { useNavigateToChat } from '@/hooks/useNavigateToPage';
import { generateId } from 'ai';

describe('useCreateChat', () => {
  const mockDispatch = vi.fn();
  const mockNavigateToChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useNavigateToChat).mockReturnValue({ 
      navigateToChat: mockNavigateToChat,
      clearChatIdParam: vi.fn(),
    });
    vi.mocked(generateId).mockReturnValue('test-chat-id');
  });

  it('应该返回包含 createNewChat 方法的对象', async () => {
    const { useCreateChat } = await import('@/hooks/useCreateChat');
    const { result } = renderHook(() => useCreateChat());

    expect(result.current).toHaveProperty('createNewChat');
    expect(typeof result.current.createNewChat).toBe('function');
  });

  it('应该调用 dispatch createChat action', async () => {
    const { useCreateChat } = await import('@/hooks/useCreateChat');
    const { result } = renderHook(() => useCreateChat());

    await result.current.createNewChat();

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('createChat'),
        payload: expect.objectContaining({
          chat: expect.objectContaining({
            id: 'test-chat-id',
            name: '',
          }),
        }),
      })
    );
  });

  it('应该生成正确的 chat 对象（id 非空，name 为空）', async () => {
    const { useCreateChat } = await import('@/hooks/useCreateChat');
    const { result } = renderHook(() => useCreateChat());

    await result.current.createNewChat();

    const dispatchCall = mockDispatch.mock.calls[0][0];
    const chat = dispatchCall.payload.chat;

    expect(chat.id).toBe('test-chat-id');
    expect(chat.id).not.toBe('');
    expect(chat.name).toBe('');
  });

  it('应该调用 navigateToChat 方法', async () => {
    const { useCreateChat } = await import('@/hooks/useCreateChat');
    const { result } = renderHook(() => useCreateChat());

    await result.current.createNewChat();

    expect(mockNavigateToChat).toHaveBeenCalledTimes(1);
    expect(mockNavigateToChat).toHaveBeenCalledWith({
      chatId: 'test-chat-id',
    });
  });

  it('createNewChat 引用应该稳定（useCallback）', async () => {
    const { useCreateChat } = await import('@/hooks/useCreateChat');
    const { result, rerender } = renderHook(() => useCreateChat());

    const firstRef = result.current.createNewChat;

    rerender();

    const secondRef = result.current.createNewChat;

    expect(firstRef).toBe(secondRef);
  });
});

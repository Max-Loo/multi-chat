/**
 * useSelectedChat Hook 单元测试
 *
 * 测试策略：Mock useCurrentSelectedChat（依赖 Redux），验证数据规范化逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useCurrentSelectedChat because it depends on Redux store
vi.mock('@/hooks/useCurrentSelectedChat', () => ({
  useCurrentSelectedChat: vi.fn(),
}));

import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import { useSelectedChat } from '@/pages/Chat/hooks/useSelectedChat';

describe('useSelectedChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回选中聊天的数据 当有选中聊天', () => {
    const mockChat = {
      id: 'chat-1',
      name: 'Test Chat',
      chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      isDeleted: false,
    };

    vi.mocked(useCurrentSelectedChat).mockReturnValue(mockChat as any);

    const { result } = renderHook(() => useSelectedChat());

    expect(result.current.selectedChat).toEqual(mockChat);
    expect(result.current.chatModelList).toEqual(mockChat.chatModelList);
  });

  it('应该返回 null 和空数组 当无选中聊天', () => {
    vi.mocked(useCurrentSelectedChat).mockReturnValue(undefined as any);

    const { result } = renderHook(() => useSelectedChat());

    expect(result.current.selectedChat).toBeNull();
    expect(result.current.chatModelList).toEqual([]);
  });

  it('应该返回空数组 当 chatModelList 缺失', () => {
    const mockChat = {
      id: 'chat-1',
      name: 'Test Chat',
      isDeleted: false,
    };

    vi.mocked(useCurrentSelectedChat).mockReturnValue(mockChat as any);

    const { result } = renderHook(() => useSelectedChat());

    expect(result.current.selectedChat).toEqual(mockChat);
    expect(result.current.chatModelList).toEqual([]);
  });
});

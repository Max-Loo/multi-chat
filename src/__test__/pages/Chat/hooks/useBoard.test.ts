/**
 * useBoard Hook 单元测试
 *
 * 测试策略：Mock useSelectedChat（依赖 useCurrentSelectedChat/Redux），验证二维数组切分和 Splitter 判断
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useSelectedChat because it depends on useCurrentSelectedChat (Redux)
vi.mock('@/pages/Chat/hooks/useSelectedChat', () => ({
  useSelectedChat: vi.fn(),
}));

import { useSelectedChat } from '@/pages/Chat/hooks/useSelectedChat';
import { useBoard } from '@/pages/Chat/hooks/useBoard';
import type { Chat } from '@/types/chat';

describe('useBoard', () => {
  const mockModels = [
    { modelId: 'model-1', chatHistoryList: [] },
    { modelId: 'model-2', chatHistoryList: [] },
    { modelId: 'model-3', chatHistoryList: [] },
    { modelId: 'model-4', chatHistoryList: [] },
    { modelId: 'model-5', chatHistoryList: [] },
  ];

  const mockChat: Chat = { id: 'chat-1' };

  beforeEach(() => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: mockChat,
      chatModelList: mockModels,
    });
  });

  it('应该按 columnCount 切分模型列表为二维数组', () => {
    const { result } = renderHook(() => useBoard(2, false));

    expect(result.current.board).toEqual([
      [mockModels[0], mockModels[1]],
      [mockModels[2], mockModels[3]],
      [mockModels[4]],
    ]);
  });

  it('应该返回空数组 当模型列表为空', () => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: null,
      chatModelList: [],
    });

    const { result } = renderHook(() => useBoard(2, false));

    expect(result.current.board).toEqual([]);
    expect(result.current.shouldUseSplitter).toBe(false);
  });

  it('应该在模型数量等于 columnCount 时正确切分', () => {
    const twoModels = [mockModels[0], mockModels[1]];
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: mockChat,
      chatModelList: twoModels,
    });

    const { result } = renderHook(() => useBoard(2, true));

    expect(result.current.board).toEqual([[mockModels[0], mockModels[1]]]);
  });

  it('应该在 isSplitter=true 且模型数量 > 1 时使用 Splitter 布局', () => {
    const { result } = renderHook(() => useBoard(2, true));

    expect(result.current.shouldUseSplitter).toBe(true);
  });

  it('应该在 isSplitter=false 时不使用 Splitter 布局', () => {
    const { result } = renderHook(() => useBoard(2, false));

    expect(result.current.shouldUseSplitter).toBe(false);
  });

  it('应该在模型数量 <= 1 时不使用 Splitter 布局', () => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: mockChat,
      chatModelList: [mockModels[0]],
    });

    const { result } = renderHook(() => useBoard(2, true));

    expect(result.current.shouldUseSplitter).toBe(false);
  });
});

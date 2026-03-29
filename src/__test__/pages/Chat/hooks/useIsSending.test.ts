/**
 * useIsSending Hook 单元测试
 *
 * 测试策略：Mock useSelectedChat 和 useAppSelector（均依赖 Redux），验证发送状态汇总逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useSelectedChat because it depends on useCurrentSelectedChat (Redux)
vi.mock('@/pages/Chat/hooks/useSelectedChat', () => ({
  useSelectedChat: vi.fn(),
}));

// Mock useAppSelector because it depends on Redux store
vi.mock('@/hooks/redux', () => ({
  useAppSelector: vi.fn(),
}));

import { useSelectedChat } from '@/pages/Chat/hooks/useSelectedChat';
import { useAppSelector } from '@/hooks/redux';
import { useIsSending } from '@/pages/Chat/hooks/useIsSending';

describe('useIsSending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回 false 当无选中聊天', () => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: null,
      chatModelList: [],
    });

    const { result } = renderHook(() => useIsSending());

    expect(result.current.isSending).toBe(false);
  });

  it('应该返回 false 当选中聊天无运行数据', () => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: { id: 'chat-1' } as any,
      chatModelList: [],
    });

    vi.mocked(useAppSelector).mockReturnValue(undefined);

    const { result } = renderHook(() => useIsSending());

    expect(result.current.isSending).toBe(false);
  });

  it('应该返回 true 当任一窗口正在发送', () => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: { id: 'chat-1' } as any,
      chatModelList: [],
    });

    vi.mocked(useAppSelector).mockReturnValue({
      window1: { isSending: false },
      window2: { isSending: true },
    });

    const { result } = renderHook(() => useIsSending());

    expect(result.current.isSending).toBe(true);
  });

  it('应该返回 false 当所有窗口均未发送', () => {
    vi.mocked(useSelectedChat).mockReturnValue({
      selectedChat: { id: 'chat-1' } as any,
      chatModelList: [],
    });

    vi.mocked(useAppSelector).mockReturnValue({
      window1: { isSending: false },
      window2: { isSending: false },
    });

    const { result } = renderHook(() => useIsSending());

    expect(result.current.isSending).toBe(false);
  });
});

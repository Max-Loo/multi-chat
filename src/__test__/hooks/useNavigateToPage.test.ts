import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useNavigateToChat } from '@/hooks/useNavigateToPage';

// Mock react-router-dom 的 useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

const mockedNavigate = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

describe('useNavigateToChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('navigateToChat 测试', () => {
    it('应导航到聊天页面并传入 chatId 参数', () => {
      const { result } = renderHook(() => useNavigateToChat(), { wrapper });

      result.current.navigateToChat({ chatId: 'test-chat-id' });

      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith('/chat?chatId=test-chat-id', {});
    });

    it('应不传 chatId 时导航到聊天页面', () => {
      const { result } = renderHook(() => useNavigateToChat(), { wrapper });

      result.current.navigateToChat();

      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith('/chat', {});
    });

    it('应支持额外的导航选项参数', () => {
      const { result } = renderHook(() => useNavigateToChat(), { wrapper });

      result.current.navigateToChat({
        chatId: 'test-chat-id',
        replace: true,
      });

      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalledWith('/chat?chatId=test-chat-id', {
        replace: true,
      });
    });

    it('应正确处理包含特殊字符的 chatId', () => {
      const { result } = renderHook(() => useNavigateToChat(), { wrapper });

      result.current.navigateToChat({ chatId: 'chat-with-special- chars_123' });

      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      // URLSearchParams 将空格编码为 + 而不是 %20
      expect(mockedNavigate).toHaveBeenCalledWith('/chat?chatId=chat-with-special-+chars_123', {});
    });

    it('应处理空字符串 chatId', () => {
      const { result } = renderHook(() => useNavigateToChat(), { wrapper });

      result.current.navigateToChat({ chatId: '' });

      expect(mockedNavigate).toHaveBeenCalledTimes(1);
      // URLSearchParams 会忽略空值，所以结果是 /chat
      expect(mockedNavigate).toHaveBeenCalledWith('/chat', {});
    });
  });
});

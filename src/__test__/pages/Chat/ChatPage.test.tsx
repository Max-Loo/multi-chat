/**
 * ChatPage 组件测试
 *
 * 测试 chatId URL 参数重定向逻辑和 mobile/desktop 条件渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ChatPage from '@/pages/Chat';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { ChatSliceState } from '@/store/slices/chatSlices';

/**
 * Mock useResponsive hook（可变状态控制 mobile/desktop）
 */
const mockResponsive = vi.fn();

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive(),
}));

/**
 * Mock useNavigateToChat hook（追踪 clearChatIdParam 调用）
 */
const mockClearChatIdParam = vi.fn();
const mockNavigateToChat = vi.fn();

vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
    clearChatIdParam: mockClearChatIdParam,
  }),
}));

/**
 * Mock Sidebar 和 Content 子组件，减少渲染复杂度
 * Reason: ChatPage 测试聚焦于 URL 重定向逻辑和条件渲染，
 * 不需要测试子组件的内部渲染行为
 */
vi.mock('@/pages/Chat/components/Sidebar', () => ({
  default: () => <div data-testid="mock-sidebar">Sidebar</div>,
}));

vi.mock('@/pages/Chat/components/Content', () => ({
  default: () => <div data-testid="mock-content">Content</div>,
}));

vi.mock('@/components/MobileDrawer', () => ({
  MobileDrawer: ({ children }: { children: React.ReactNode; isOpen: boolean; onOpenChange: (open: boolean) => void; showCloseButton: boolean }) => (
    <div data-testid="mock-mobile-drawer">{children}</div>
  ),
}));

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: { selectChatToStart: '选择一个聊天开始对话' },
  }),
);

/**
 * 创建带有 chat 状态的测试 store
 */
function createChatPageStore(chatOverrides?: Partial<ChatSliceState>) {
  return createTypeSafeTestStore({
    chat: createChatSliceState({
      chatList: [
        { id: 'chat-1', name: '测试聊天1', chatModelList: [], isDeleted: false },
        { id: 'chat-2', name: '测试聊天2', chatModelList: [], isDeleted: true },
      ],
      ...chatOverrides,
    }),
    chatPage: createChatPageSliceState(),
  });
}

/**
 * 渲染 ChatPage 的辅助函数
 * @param route 路由路径（含 query 参数）
 * @param chatOverrides chat state 覆盖
 */
function renderChatPage(route = '/chat', chatOverrides?: Partial<ChatSliceState>) {
  const store = createChatPageStore(chatOverrides);
  return renderWithProviders(<ChatPage />, { store, route });
}

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponsive.mockReturnValue({
      layoutMode: 'desktop',
      width: 1280,
      height: 800,
      isMobile: false,
      isCompact: false,
      isCompressed: false,
      isDesktop: true,
    });
  });

  describe('chatId URL 重定向', () => {
    it('不应该执行重定向 当聊天列表正在加载', async () => {
      renderChatPage('/chat?chatId=chat-1', { loading: true });

      // useEffect 依赖 loading，加载中时应早返回
      await waitFor(() => {
        expect(mockClearChatIdParam).not.toHaveBeenCalled();
      });
    });

    it('不应该执行重定向 当存在初始化错误', async () => {
      renderChatPage('/chat?chatId=chat-1', {
        loading: false,
        initializationError: '加载失败',
      });

      await waitFor(() => {
        expect(mockClearChatIdParam).not.toHaveBeenCalled();
      });
    });

    it('应该选中聊天 当 chatId 对应的聊天存在且未删除', async () => {
      const { store } = renderChatPage('/chat?chatId=chat-1');

      await waitFor(() => {
        const state = store.getState();
        expect(state.chat.selectedChatId).toBe('chat-1');
      });

      expect(mockClearChatIdParam).not.toHaveBeenCalled();
    });

    it('应该清除 chatId 参数 当聊天已删除', async () => {
      renderChatPage('/chat?chatId=chat-2');

      await waitFor(() => {
        expect(mockClearChatIdParam).toHaveBeenCalledOnce();
      });
    });

    it('应该清除 chatId 参数 当聊天不存在', async () => {
      renderChatPage('/chat?chatId=nonexistent');

      await waitFor(() => {
        expect(mockClearChatIdParam).toHaveBeenCalledOnce();
      });
    });
  });

  describe('mobile/desktop 条件渲染', () => {
    it('应该渲染 MobileDrawer 当 isMobile 为 true', () => {
      mockResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 375,
        height: 800,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      renderChatPage();

      expect(screen.getByTestId('mock-mobile-drawer')).toBeInTheDocument();
      // mobile 模式下不直接渲染侧边栏 div
      expect(screen.queryByTestId('chat-sidebar')).not.toBeInTheDocument();
    });

    it('应该直接渲染侧边栏 当 isMobile 为 false', () => {
      mockResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });

      renderChatPage();

      expect(screen.queryByTestId('mock-mobile-drawer')).not.toBeInTheDocument();
      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
    });
  });
});

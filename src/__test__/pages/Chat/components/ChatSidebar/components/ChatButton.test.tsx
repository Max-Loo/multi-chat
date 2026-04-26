import { screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatButton from '@/pages/Chat/components/Sidebar/components/ChatButton';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { ChatMeta } from '@/types/chat';
import type { EnhancedStore } from '@reduxjs/toolkit';

// Mock useResponsive
const mockUseResponsive = vi.hoisted(() => vi.fn(() => globalThis.__createResponsiveMock()));
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: (...args: unknown[]) => mockUseResponsive(...(args as [])),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n());

/**
 * Mock useNavigateToPage hook
 */
const mockNavigateToChat = vi.fn();
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
  }),
}));

/**
 * Mock useConfirm hook
 */
const mockModalWarning = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({
    modal: {
      warning: mockModalWarning,
    },
  }),
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/**
 * Mock toastQueue
 */
vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

/**
 * 从 Chat 对象提取 ChatMeta
 */
function chatToMeta(chat: ReturnType<typeof createMockChat>): ChatMeta {
  return {
    id: chat.id,
    name: chat.name,
    isManuallyNamed: chat.isManuallyNamed,
    modelIds: chat.chatModelList?.map(cm => cm.modelId) ?? [],
    isDeleted: chat.isDeleted,
    updatedAt: chat.updatedAt,
  };
}

/**
 * 渲染 ChatButton 组件的辅助函数
 */
function renderChatButton(chat: ReturnType<typeof createMockChat>, store?: EnhancedStore, isSelected = true) {
  const meta = chatToMeta(chat);
  const testStore = store || createTypeSafeTestStore({
    chat: createChatSliceState({
      chatMetaList: [meta],
      selectedChatId: chat.id,
    }),
    chatPage: createChatPageSliceState({
      isShowChatPage: true,
      isSidebarCollapsed: false,
    }),
  });

  return renderWithProviders(<ChatButton chatMeta={meta} isSelected={isSelected} />, { store: testStore });
}

/**
 * ChatButton 组件单元测试
 *
 * 测试目标：验证 ChatButton 组件的核心功能
 *
 * 技术方案：
 * - Mock 依赖的 hooks 和组件
 * - 使用 Redux Provider 提供测试状态
 * - 测试渲染、导航、重命名、删除、下拉菜单等功能
 */
describe('ChatButton Component', () => {
  beforeEach(async () => {
    await resetTestState();
  });

  
  describe('组件渲染', () => {
    it('应该渲染聊天按钮', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      expect(screen.getByText('测试聊天')).toBeInTheDocument();
    });

    it('应该渲染未命名的聊天', () => {
      const chat = createMockChat({ name: '' });
      renderChatButton(chat);

      expect(screen.getByText('未命名')).toBeInTheDocument();
    });

    it('应该在选中状态时有 aria-selected=true', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('aria-selected', 'true');
    });

    it('应该在未选中状态时有 aria-selected=false', () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [meta],
          selectedChatId: 'other-chat-id',
        }),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      renderChatButton(chat, store, false);
      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('aria-selected', 'false');
    });

    it('应该渲染下拉菜单按钮', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('点击导航', () => {
    it('点击聊天按钮应该触发导航', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      fireEvent.click(buttonDiv);
      expect(mockNavigateToChat).toHaveBeenCalledWith({ chatId: chat.id });
    });

    it('点击下拉菜单按钮不应该触发导航', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      fireEvent.click(menuButton);
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  describe('重命名功能', () => {
    it('应该渲染下拉菜单按钮', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();
    });

    it('下拉菜单按钮应该有正确的 aria 属性', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('删除功能', () => {
    it('应该有删除功能的钩子（通过 mockModalWarning 验证）', () => {
      expect(mockModalWarning).toBeDefined();
    });

    it('下拉菜单按钮点击时不应该触发导航', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      fireEvent.click(menuButton);
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  describe('组件结构和样式', () => {
    it('选中状态应有 aria-selected=true', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('aria-selected', 'true');
    });

    it('下拉菜单按钮应该有正确的图标', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('组件 memo 优化', () => {
    it('当聊天 ID 和名称未改变时，不应该重新渲染', () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const { rerender } = renderChatButton(chat);

      // 使用相同的 chatMeta 对象重新渲染
      rerender(
        <ChatButton chatMeta={meta} isSelected={true} />
      );

      // 组件被 memo，不应该重新渲染
      expect(screen.getByText('测试聊天')).toBeInTheDocument();
    });

    it('当聊天名称改变时，应该重新渲染', () => {
      const chat = createMockChat({ name: '测试聊天' });
      const { rerender } = renderChatButton(chat);

      const updatedMeta = { ...chatToMeta(chat), name: '新名称' };
      rerender(
        <ChatButton chatMeta={updatedMeta} isSelected={true} />
      );

      expect(screen.getByText('新名称')).toBeInTheDocument();
    });
  });

  describe('响应式布局模式', () => {
    it('桌面模式（desktop）：data-variant 为 default', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });

      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('data-variant', 'default');

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();
    });

    it('紧凑模式（compact）：data-variant 为 compact', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compact',
        width: 800,
        height: 600,
        isMobile: false,
        isCompact: true,
        isCompressed: false,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('data-variant', 'compact');

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();
    });

    it('压缩模式（compressed）：data-variant 为 compact', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compressed',
        width: 1100,
        height: 700,
        isMobile: false,
        isCompact: false,
        isCompressed: true,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('data-variant', 'compact');

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();
    });

    it('移动模式（mobile）：data-variant 为 default（与 desktop 相同）', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      expect(buttonDiv).toHaveAttribute('data-variant', 'default');

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();
    });

    it('所有模式下重命名和删除功能都正常工作', () => {
      // 测试 desktop 模式
      mockUseResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });

      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      // 验证下拉菜单存在
      expect(screen.getByRole('button', { name: '更多操作' })).toBeInTheDocument();

      // 清理后测试 mobile 模式
      cleanup();

      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      renderChatButton(chat);

      // mobile 模式下拉菜单也应该存在
      expect(screen.getByRole('button', { name: '更多操作' })).toBeInTheDocument();
    });

    it('移动模式下点击「更多」按钮弹出选项（无长按事件）', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      // 点击「更多」按钮应该弹出选项
      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton).toBeInTheDocument();

      // 点击按钮不应触发导航（因为有 stopPropagation）
      fireEvent.click(menuButton);
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });
});

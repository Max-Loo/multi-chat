/**
 * Placeholder 组件单元测试
 *
 * 覆盖移动端和桌面端两种渲染模式下的 UI 渲染和交互行为
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import Placeholder from '@/pages/Chat/components/Placeholder';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatPageSliceState } from '@/__test__/helpers/mocks/testState';

/** Mock useResponsive hook（可变状态控制 mobile/desktop） */
const mockResponsive = vi.fn();

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive(),
}));

/** Mock useCreateChat hook */
const mockCreateNewChat = vi.fn();

vi.mock('@/hooks/useCreateChat', () => ({
  useCreateChat: () => ({ createNewChat: mockCreateNewChat }),
}));

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: { selectChatToStart: '选择一个聊天开始对话' },
    navigation: { openChatList: '打开聊天列表', createChat: '创建聊天' },
  }),
);

/** 渲染 Placeholder 的辅助函数 */
function renderPlaceholder(isMobile = false) {
  mockResponsive.mockReturnValue({
    layoutMode: isMobile ? 'mobile' : 'desktop',
    width: isMobile ? 375 : 1280,
    height: 800,
    isMobile,
    isCompact: false,
    isCompressed: false,
    isDesktop: !isMobile,
  });

  const store = createTypeSafeTestStore({
    chatPage: createChatPageSliceState(),
  });

  return renderWithProviders(<Placeholder />, { store });
}

describe('Placeholder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('移动端渲染', () => {
    it('应该在 isMobile: true 下渲染菜单按钮和新建聊天按钮', () => {
      renderPlaceholder(true);

      expect(screen.getByLabelText('打开聊天列表')).toBeInTheDocument();
      expect(screen.getByLabelText('创建聊天')).toBeInTheDocument();
    });

    it('应该在点击菜单按钮时 dispatch toggleDrawer', () => {
      const { store } = renderPlaceholder(true);

      fireEvent.click(screen.getByLabelText('打开聊天列表'));

      // toggleDrawer 切换 drawerOpen 状态，初始为 false
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
    });

    it('应该在点击新建聊天按钮时触发 createNewChat', () => {
      renderPlaceholder(true);

      fireEvent.click(screen.getByLabelText('创建聊天'));

      expect(mockCreateNewChat).toHaveBeenCalledOnce();
    });
  });

  describe('桌面端渲染', () => {
    it('应该在 isMobile: false 下不渲染操作按钮', () => {
      renderPlaceholder(false);

      expect(screen.queryByLabelText('打开聊天列表')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('创建聊天')).not.toBeInTheDocument();
    });
  });

  describe('占位文本渲染', () => {
    it('应该在移动端渲染占位提示文本', () => {
      renderPlaceholder(true);
      expect(screen.getByText('选择一个聊天开始对话')).toBeInTheDocument();
    });

    it('应该在桌面端渲染占位提示文本', () => {
      renderPlaceholder(false);
      expect(screen.getByText('选择一个聊天开始对话')).toBeInTheDocument();
    });
  });

  describe('toggleDrawer 切换行为', () => {
    it('应该在连续点击菜单按钮时切换 isDrawerOpen 状态', () => {
      const { store } = renderPlaceholder(true);

      expect(store.getState().chatPage.isDrawerOpen).toBe(false);

      fireEvent.click(screen.getByLabelText('打开聊天列表'));
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      fireEvent.click(screen.getByLabelText('打开聊天列表'));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });
  });
});

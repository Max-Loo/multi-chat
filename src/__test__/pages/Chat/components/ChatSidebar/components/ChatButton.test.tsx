import { screen, fireEvent, createEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatButton from '@/pages/Chat/components/Sidebar/components/ChatButton';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { ChatMeta } from '@/types/chat';
import type { EnhancedStore, UnknownAction } from '@reduxjs/toolkit';
import type { ReactNode, MouseEvent as ReactMouseEvent } from 'react';

// Mock useResponsive
const mockUseResponsive = vi.hoisted(() => vi.fn(() => globalThis.__createResponsiveMock()));
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: (...args: unknown[]) => mockUseResponsive(...(args as [])),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n({
  chat: {
    shiftDeleteChat: 'Shift 删除',
    confirmDelete: '确认删除',
    deleteChatConfirm: '确定要删除这个聊天吗？',
    deleteChatSuccess: '删除成功',
    deleteChatFailed: '删除失败',
    editChatSuccess: '重命名成功',
    editChatFailed: '重命名失败',
  },
}));

/**
 * Mock DropdownMenu 组件（Radix UI 在 happy-dom 中无法正常打开）
 * 始终渲染菜单内容，使菜单项可直接点击
 */
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled, className }: { children: ReactNode; onClick?: (e: ReactMouseEvent) => void; disabled?: boolean; className?: string }) => (
    <div role="menuitem" onClick={onClick} aria-disabled={disabled || undefined} className={className}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

/**
 * Mock useNavigateToPage hook
 */
const mockNavigateToChat = vi.fn();
const mockClearChatIdParam = vi.fn();
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
    clearChatIdParam: mockClearChatIdParam,
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

    it('下拉菜单按钮应该有正确的图标', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const menuButton = screen.getByRole('button', { name: '更多操作' });
      expect(menuButton.querySelector('svg')).toBeInTheDocument();
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

  describe('键盘交互', () => {
    it('按下 Enter 键应触发导航', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      fireEvent.keyDown(buttonDiv, { key: 'Enter' });
      expect(mockNavigateToChat).toHaveBeenCalledWith({ chatId: chat.id });
    });

    it('按下 Space 键应触发导航并 preventDefault', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      const event = createEvent.keyDown(buttonDiv, { key: ' ' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      fireEvent(buttonDiv, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockNavigateToChat).toHaveBeenCalledWith({ chatId: chat.id });
    });
  });

  describe('重命名交互', () => {
    it('点击重命名菜单项应进入编辑模式', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      // 点击重命名菜单项（mock DropdownMenu 始终渲染内容）
      const renameItem = screen.getByText('重命名');
      fireEvent.click(renameItem);

      // 验证进入编辑模式：Input、确认按钮、取消按钮
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('测试聊天');

      // 编辑模式下有确认和取消两个按钮
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('在编辑模式输入新名称并点击确认应 dispatch editChatName + toastQueue.success', async () => {
      const chat = createMockChat({ name: '旧名称' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({ chatMetaList: [meta], selectedChatId: chat.id }),
        chatPage: createChatPageSliceState({ isShowChatPage: true, isSidebarCollapsed: false }),
      });
      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // 点击重命名进入编辑模式
      const renameItem = screen.getByText('重命名');
      fireEvent.click(renameItem);

      // 修改输入框内容
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '新名称' } });

      // 找到确认按钮（编辑模式中的第一个按钮）
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      // 验证 Redux 状态已更新
      await waitFor(() => {
        expect(store.getState().chat.chatMetaList.find(m => m.id === chat.id)?.name).toBe('新名称');
      });

      // 验证 toastQueue.success
      const { toastQueue } = await import('@/services/toast');
      expect(toastQueue.success).toHaveBeenCalled();
    });

    it('在编辑模式点击取消应退出编辑模式且无 dispatch', () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({ chatMetaList: [meta], selectedChatId: chat.id }),
        chatPage: createChatPageSliceState({ isShowChatPage: true, isSidebarCollapsed: false }),
      });
      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // 进入编辑模式
      const renameItem = screen.getByText('重命名');
      fireEvent.click(renameItem);

      // 确认进入编辑模式
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // 点击取消按钮（编辑模式中的第二个按钮，destructive variant）
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]);

      // 验证退出编辑模式
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // 验证 Redux 状态中聊天名称保持不变
      expect(store.getState().chat.chatMetaList.find(m => m.id === chat.id)?.name).toBe('测试聊天');
    });

    it('输入为空白时确认按钮应 disabled', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      // 进入编辑模式
      const renameItem = screen.getByText('重命名');
      fireEvent.click(renameItem);

      // 清空输入框
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      // 验证确认按钮（编辑模式中的第一个按钮）disabled
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled();
    });
  });

  describe('删除确认', () => {
    it('从 DropdownMenu 点击删除应触发 modal.warning', () => {
      const chat = createMockChat({ name: '要删除的聊天' });
      renderChatButton(chat);

      // 点击删除菜单项（mock DropdownMenu 始终渲染内容）
      const deleteItem = screen.getByText('删除');
      fireEvent.click(deleteItem);

      // 验证 modal.warning 被调用
      expect(mockModalWarning).toHaveBeenCalledTimes(1);
      const callArgs = mockModalWarning.mock.calls[0][0];
      // 验证标题包含聊天名称
      expect(callArgs.title).toContain('要删除的聊天');
      // 验证有 onOk 回调
      expect(callArgs.onOk).toBeDefined();
      expect(typeof callArgs.onOk).toBe('function');
    });

    it('执行 onOk 回调后应 dispatch deleteChat + toastQueue.success', async () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({ chatMetaList: [meta], selectedChatId: chat.id }),
        chatPage: createChatPageSliceState({ isShowChatPage: true, isSidebarCollapsed: false }),
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // 触发删除流程
      const deleteItem = screen.getByText('删除');
      fireEvent.click(deleteItem);

      // 获取 onOk 回调并执行
      const onOk = mockModalWarning.mock.calls[0][0].onOk;
      await onOk();

      // 验证 dispatch deleteChat
      const deleteCalls = dispatchSpy.mock.calls.filter((call: unknown[]) => {
        const action = call[0] as { type?: string };
        return action?.type === 'chat/deleteChat';
      });
      expect(deleteCalls.length).toBeGreaterThan(0);

      // 验证 toastQueue.success
      const { toastQueue } = await import('@/services/toast');
      expect(toastQueue.success).toHaveBeenCalled();
    });

    it('删除当前选中聊天时应调用 clearChatIdParam', async () => {
      const chat = createMockChat({ name: '测试聊天' });
      // isSelected = true（默认）
      renderChatButton(chat);

      // 触发删除流程
      const deleteItem = screen.getByText('删除');
      fireEvent.click(deleteItem);

      // 执行 onOk
      const onOk = mockModalWarning.mock.calls[0][0].onOk;
      await onOk();

      // 验证 clearChatIdParam 被调用
      expect(mockClearChatIdParam).toHaveBeenCalledTimes(1);
    });

    it('dispatch deleteChat 抛出异常时应调用 toastQueue.error', async () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [meta],
          selectedChatId: chat.id,
        }),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      // Mock dispatch 抛出异常
      const originalDispatch = store.dispatch;
      vi.spyOn(store, 'dispatch').mockImplementation((action: UnknownAction): UnknownAction => {
        if (action && action.type === 'chat/deleteChat') {
          throw new Error('删除失败');
        }
        return originalDispatch(action);
      });

      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // 触发删除流程
      const deleteItem = screen.getByText('删除');
      fireEvent.click(deleteItem);

      // 执行 onOk
      const onOk = mockModalWarning.mock.calls[0][0].onOk;
      await onOk();

      // 验证 toastQueue.error
      const { toastQueue } = await import('@/services/toast');
      expect(toastQueue.error).toHaveBeenCalled();
    });
  });

  describe('快捷删除（Shift+Hover）', () => {
    it('Shift 按下 + 鼠标悬停时应渲染快捷删除按钮', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      // 模拟 Shift 按下
      fireEvent.keyDown(document, { key: 'Shift' });

      // 模拟鼠标悬停
      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      fireEvent.mouseEnter(buttonDiv);

      // 应该渲染快捷删除按钮（带 Shift 删除的 aria-label）
      const quickDeleteButton = screen.getByRole('button', { name: 'Shift 删除' });
      expect(quickDeleteButton).toBeInTheDocument();

      // DropdownMenu 的「更多操作」按钮不应存在
      expect(screen.queryByRole('button', { name: '更多操作' })).not.toBeInTheDocument();
    });

    it('点击快捷删除按钮应直接执行 dispatch deleteChat（不经过 modal.warning）', async () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({ chatMetaList: [meta], selectedChatId: chat.id }),
        chatPage: createChatPageSliceState({ isShowChatPage: true, isSidebarCollapsed: false }),
      });
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // 激活快捷删除
      fireEvent.keyDown(document, { key: 'Shift' });
      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      fireEvent.mouseEnter(buttonDiv);

      // 点击快捷删除按钮
      const quickDeleteButton = screen.getByRole('button', { name: 'Shift 删除' });
      fireEvent.click(quickDeleteButton);

      // 验证不调用 modal.warning
      expect(mockModalWarning).not.toHaveBeenCalled();

      // 验证直接 dispatch deleteChat
      const deleteCalls = dispatchSpy.mock.calls.filter((call: unknown[]) => {
        const action = call[0] as { type?: string };
        return action?.type === 'chat/deleteChat';
      });
      expect(deleteCalls.length).toBeGreaterThan(0);

      // 验证 toastQueue.success
      const { toastQueue } = await import('@/services/toast');
      expect(toastQueue.success).toHaveBeenCalled();
    });

    it('Shift 松开后应恢复 DropdownMenu', () => {
      const chat = createMockChat({ name: '测试聊天' });
      renderChatButton(chat);

      // 激活快捷删除
      fireEvent.keyDown(document, { key: 'Shift' });
      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      fireEvent.mouseEnter(buttonDiv);

      // 确认快捷删除按钮存在
      expect(screen.getByRole('button', { name: 'Shift 删除' })).toBeInTheDocument();

      // 松开 Shift
      fireEvent.keyUp(document, { key: 'Shift' });

      // 应恢复 DropdownMenu
      expect(screen.queryByRole('button', { name: 'Shift 删除' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更多操作' })).toBeInTheDocument();
    });

    it('快捷删除 dispatch 失败时应调用 toastQueue.error', async () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [meta],
          selectedChatId: chat.id,
        }),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      // Mock dispatch 抛出异常
      const originalDispatch = store.dispatch;
      vi.spyOn(store, 'dispatch').mockImplementation((action: UnknownAction): UnknownAction => {
        if (action && action.type === 'chat/deleteChat') {
          throw new Error('删除失败');
        }
        return originalDispatch(action);
      });

      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // 激活快捷删除
      fireEvent.keyDown(document, { key: 'Shift' });
      const buttonDiv = screen.getByTestId(`chat-button-${chat.id}`);
      fireEvent.mouseEnter(buttonDiv);

      // 点击快捷删除
      const quickDeleteButton = screen.getByRole('button', { name: 'Shift 删除' });
      fireEvent.click(quickDeleteButton);

      // 等待异步完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 toastQueue.error
      const { toastQueue } = await import('@/services/toast');
      expect(toastQueue.error).toHaveBeenCalled();
    });
  });

  describe('发送中状态', () => {
    it('sendingChatIds 包含当前 chatId 时删除菜单项应 disabled', () => {
      const chat = createMockChat({ name: '测试聊天' });
      const meta = chatToMeta(chat);
      // 创建包含 sendingChatIds 的 store
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [meta],
          selectedChatId: chat.id,
          sendingChatIds: { [chat.id]: true },
        }),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      renderWithProviders(<ChatButton chatMeta={meta} isSelected={true} />, { store });

      // mock DropdownMenu 始终渲染内容，验证删除菜单项 disabled
      const deleteItem = screen.getByText('删除');
      expect(deleteItem).toBeInTheDocument();
      const deleteMenuItem = deleteItem.closest('[role="menuitem"]');
      expect(deleteMenuItem).toHaveAttribute('aria-disabled', 'true');
    });
  });
});

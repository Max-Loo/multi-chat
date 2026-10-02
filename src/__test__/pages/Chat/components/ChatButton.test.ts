/**
 * ChatButton 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx，
 * 保留核心行为语义：
 * - 渲染（名称、未命名、aria-selected、data-variant）
 * - 点击导航与键盘激活（Enter/Space）
 * - 重命名（确认/取消/未变化/空白禁用）
 * - 删除（确认对话框、成功/失败 toast、选中聊天清除 URL 参数）
 * - 快捷删除（Shift + 悬停）
 * - 发送中禁用删除
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
  /** 确认对话框 warning 的可控行为 */
  modalWarning: vi.fn(),
  navigateToChat: vi.fn(),
  clearChatIdParam: vi.fn(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mocks.navigateToChat,
    clearChatIdParam: mocks.clearChatIdParam,
  }),
}));

vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ modal: { warning: mocks.modalWarning } }),
}));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

import ChatButton from '@/pages/Chat/components/Sidebar/components/ChatButton.vue';
import { createAppPinia } from '@/stores';
import { useChatStore } from '@/stores';
import { toastQueue } from '@/services/toast';
import type { ChatMeta } from '@/types/chat';

/** 创建测试聊天元数据 */
const createMeta = (overrides?: Partial<ChatMeta>): ChatMeta => ({
  id: 'chat-1',
  name: '测试聊天',
  modelIds: [],
  isDeleted: false,
  ...overrides,
});

/** 渲染 ChatButton */
function renderButton(metaOverrides?: Partial<ChatMeta>, isSelected = false) {
  const pinia = createAppPinia();
  const result = render(ChatButton, {
    props: { chatMeta: createMeta(metaOverrides), isSelected },
    global: { plugins: [pinia] },
  });
  return { ...result, pinia };
}

/** 打开「更多操作」菜单 */
async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByTestId('chat-menu-trigger'));
  await screen.findByRole('menu');
  return user;
}

describe('ChatButton 组件（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  describe('组件渲染', () => {
    it('应该渲染聊天按钮', () => {
      renderButton();

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-name')).toHaveTextContent('测试聊天');
    });

    it('应该渲染未命名的聊天', () => {
      renderButton({ name: '' });

      expect(screen.getByTestId('chat-name')).toHaveTextContent('未命名');
    });

    it('应该按选中状态设置 aria-selected', () => {
      const { unmount } = renderButton(undefined, true);
      expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      unmount();

      renderButton(undefined, false);
      expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('应该渲染更多操作菜单按钮', () => {
      renderButton();

      expect(screen.getByTestId('chat-menu-trigger')).toBeInTheDocument();
    });
  });

  describe('点击导航', () => {
    it('点击聊天按钮应该触发导航', async () => {
      renderButton();

      await fireEvent.click(screen.getByTestId('chat-button-chat-1'));

      expect(mocks.navigateToChat).toHaveBeenCalledWith({ chatId: 'chat-1' });
    });

    it('按下 Enter 键应触发导航', async () => {
      renderButton();

      await fireEvent.keyDown(screen.getByTestId('chat-button-chat-1'), {
        key: 'Enter',
      });

      expect(mocks.navigateToChat).toHaveBeenCalled();
    });

    it('按下 Space 键应触发导航', async () => {
      renderButton();

      await fireEvent.keyDown(screen.getByTestId('chat-button-chat-1'), {
        key: ' ',
      });

      expect(mocks.navigateToChat).toHaveBeenCalled();
    });
  });

  describe('响应式布局变体', () => {
    it('桌面模式 data-variant 为 default', () => {
      renderButton();

      expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
        'data-variant',
        'default',
      );
    });

    it('紧凑模式 data-variant 为 compact', () => {
      mocks.responsive.__set({ isCompact: true, isDesktop: false });

      renderButton();

      expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
        'data-variant',
        'compact',
      );
    });

    it('移动模式 data-variant 为 default', () => {
      mocks.responsive.__set({ isMobile: true });

      renderButton();

      expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
        'data-variant',
        'default',
      );
    });
  });

  describe('重命名功能', () => {
    it('点击重命名菜单项应进入编辑模式', async () => {
      renderButton();
      const user = await openMenu();

      await user.click(screen.getByText('重命名'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('输入新名称并确认应调用 editChatName + toast success', async () => {
      const { pinia } = renderButton();
      const chatStore = useChatStore(pinia);
      chatStore.chatMetaList = [createMeta()];
      const editSpy = vi.spyOn(chatStore, 'editChatName');

      const user = await openMenu();
      await user.click(screen.getByText('重命名'));
      await fireEvent.update(screen.getByRole('textbox'), '新名字');
      // 重命名态仅有确认/取消两个按钮，取消按钮带 text-white 类
      const confirmBtn = screen
        .getAllByRole('button')
        .find((b) => !b.className.includes('text-white'));
      if (confirmBtn) await user.click(confirmBtn);

      expect(editSpy).toHaveBeenCalledWith('chat-1', '新名字');
      expect(toastQueue.success).toHaveBeenCalledWith('编辑聊天成功');
    });

    it('重命名时名称未改变应退出编辑模式且不 dispatch', async () => {
      const { pinia } = renderButton();
      const chatStore = useChatStore(pinia);
      chatStore.chatMetaList = [createMeta()];
      const editSpy = vi.spyOn(chatStore, 'editChatName');

      const user = await openMenu();
      await user.click(screen.getByText('重命名'));
      // 不修改内容，直接确认（默认填入原名称）
      const confirmBtn = screen
        .getAllByRole('button')
        .find((b) => !b.className.includes('text-white'));
      if (confirmBtn) await user.click(confirmBtn);

      expect(editSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('输入为空白时确认按钮应 disabled', async () => {
      renderButton();
      const user = await openMenu();
      await user.click(screen.getByText('重命名'));
      await fireEvent.update(screen.getByRole('textbox'), '   ');

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find((b) => b.hasAttribute('disabled'));
      expect(confirmButton).toBeDefined();
    });
  });

  describe('删除功能', () => {
    it('从菜单点击删除应触发确认对话框', async () => {
      renderButton();
      const user = await openMenu();

      await user.click(screen.getByText('删除'));

      expect(mocks.modalWarning).toHaveBeenCalledOnce();
    });

    it('执行 onOk 回调后应 deleteChat + toast success', async () => {
      const { pinia } = renderButton();
      const chatStore = useChatStore(pinia);
      chatStore.chatMetaList = [createMeta()];
      const deleteSpy = vi.spyOn(chatStore, 'deleteChat');

      const user = await openMenu();
      await user.click(screen.getByText('删除'));
      // 执行确认回调
      const { onOk } = mocks.modalWarning.mock.calls[0][0] as { onOk: () => void };
      await onOk();

      expect(deleteSpy).toHaveBeenCalled();
      expect(toastQueue.success).toHaveBeenCalledWith('删除聊天成功');
    });

    it('删除当前选中聊天时应调用 clearChatIdParam', async () => {
      renderButton(undefined, true);
      const user = await openMenu();

      await user.click(screen.getByText('删除'));
      const { onOk } = mocks.modalWarning.mock.calls[0][0] as { onOk: () => void };
      await onOk();

      expect(mocks.clearChatIdParam).toHaveBeenCalled();
    });

    it('deleteChat 抛出异常时应调用 toast error', async () => {
      const { pinia } = renderButton();
      const chatStore = useChatStore(pinia);
      chatStore.chatMetaList = [createMeta()];
      vi.spyOn(chatStore, 'deleteChat').mockRejectedValueOnce(
        new Error('delete failed'),
      );

      const user = await openMenu();
      await user.click(screen.getByText('删除'));
      const { onOk } = mocks.modalWarning.mock.calls[0][0] as { onOk: () => void };
      await onOk();

      expect(toastQueue.error).toHaveBeenCalledWith('删除聊天失败');
    });
  });

  describe('快捷删除（Shift+Hover）', () => {
    it('Shift 按下 + 鼠标悬停时应渲染快捷删除按钮', async () => {
      renderButton();
      const button = screen.getByTestId('chat-button-chat-1');

      await fireEvent.keyDown(document, { key: 'Shift' });
      await fireEvent.mouseEnter(button);

      expect(
        screen.getByLabelText('Shift+点击快捷删除'),
      ).toBeInTheDocument();
    });

    it('点击快捷删除按钮应直接执行 deleteChat（不经过确认对话框）', async () => {
      const { pinia } = renderButton();
      const chatStore = useChatStore(pinia);
      chatStore.chatMetaList = [createMeta()];
      const deleteSpy = vi.spyOn(chatStore, 'deleteChat');
      const button = screen.getByTestId('chat-button-chat-1');

      await fireEvent.keyDown(document, { key: 'Shift' });
      await fireEvent.mouseEnter(button);
      await fireEvent.click(screen.getByLabelText('Shift+点击快捷删除'));

      expect(deleteSpy).toHaveBeenCalled();
      expect(mocks.modalWarning).not.toHaveBeenCalled();
    });

    it('Shift 松开后应恢复下拉菜单', async () => {
      renderButton();
      const button = screen.getByTestId('chat-button-chat-1');

      await fireEvent.keyDown(document, { key: 'Shift' });
      await fireEvent.mouseEnter(button);
      await fireEvent.keyUp(document, { key: 'Shift' });

      expect(
        screen.queryByLabelText('Shift+点击快捷删除'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('chat-menu-trigger')).toBeInTheDocument();
    });

    it('快捷删除 dispatch 失败时应调用 toast error', async () => {
      const { pinia } = renderButton();
      const chatStore = useChatStore(pinia);
      chatStore.chatMetaList = [createMeta()];
      vi.spyOn(chatStore, 'deleteChat').mockRejectedValueOnce(
        new Error('delete failed'),
      );
      const button = screen.getByTestId('chat-button-chat-1');

      await fireEvent.keyDown(document, { key: 'Shift' });
      await fireEvent.mouseEnter(button);
      await fireEvent.click(screen.getByLabelText('Shift+点击快捷删除'));

      expect(toastQueue.error).toHaveBeenCalledWith('删除聊天失败');
    });
  });

  describe('发送中状态', () => {
    it('sendingChatIds 包含当前 chatId 时删除菜单项应 disabled', async () => {
      const { pinia } = renderButton();
      useChatStore(pinia).sendingChatIds = { 'chat-1': true };

      const user = await openMenu();
      const deleteItem = screen.getByText('删除').closest('[role="menuitem"]');

      expect(deleteItem).toHaveAttribute('data-disabled');
      void user;
    });
  });
});

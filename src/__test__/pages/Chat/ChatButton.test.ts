/**
 * ChatButton 组件测试（转写自 React 同名测试）
 *
 * 验证渲染、选中态、导航、重命名与删除流程
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import ChatButton from '@/pages/Chat/components/Sidebar/components/ChatButton.vue';
import { useChatStore } from '@/store/chat';
import type { ChatMeta } from '@/types/chat';

const routerMock = vi.hoisted(() => ({
  navigateToChat: vi.fn(),
  clearChatIdParam: vi.fn(),
}));

vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => routerMock,
}));

const confirmMock = vi.hoisted(() => ({ warning: vi.fn() }));

vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ modal: confirmMock }),
}));

const responsiveMock = vi.hoisted(() => ({ layoutMode: 'desktop' as string }));

vi.mock('@/composables/useResponsive', async () => {
  const { computed } = await import('vue');
  return {
    useResponsive: () => ({
      layoutMode: computed(() => responsiveMock.layoutMode),
    }),
  };
});

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: { confirm: '确定', cancel: '取消' },
      chat: {
        unnamed: '未命名',
        rename: '重命名',
        delete: '删除',
        confirmDelete: '确认删除',
        deleteChatConfirm: '删除后不可恢复',
        deleteChatSuccess: '删除成功',
        deleteChatFailed: '删除失败',
        editChatSuccess: '重命名成功',
        editChatFailed: '重命名失败',
        shiftDeleteChat: '快捷删除',
        moreActions: '更多操作',
      },
    }).useTranslation(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat' }),
  useRouter: () => ({ push: vi.fn() }),
}));

/** 构造聊天元数据 */
function makeMeta(overrides: Partial<ChatMeta> = {}): ChatMeta {
  return { id: 'chat-1', name: '测试聊天', modelIds: [], isDeleted: false, ...overrides };
}

/** 挂载 ChatButton（需要真实 Pinia 供 deleteChat/editChatName 调用） */
function mount(meta = makeMeta(), isSelected = false) {
  return render(ChatButton, { props: { chatMeta: meta, isSelected } });
}

describe('ChatButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    responsiveMock.layoutMode = 'desktop';
  });

  it('应该渲染聊天名称', () => {
    mount();

    expect(screen.getByTestId('chat-name')).toHaveTextContent('测试聊天');
  });

  it('未命名聊天应该显示占位名称', () => {
    mount(makeMeta({ name: '' }));

    expect(screen.getByTestId('chat-name')).toHaveTextContent('未命名');
  });

  it('选中状态应该反映在 aria-selected', () => {
    mount(makeMeta(), true);

    expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('未选中时 aria-selected 为 false', () => {
    mount(makeMeta(), false);

    expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('桌面模式 data-variant 应为 default', () => {
    mount();

    expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
      'data-variant',
      'default',
    );
  });

  it('紧凑模式 data-variant 应为 compact', () => {
    responsiveMock.layoutMode = 'compact';
    mount();

    expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
      'data-variant',
      'compact',
    );
  });

  it('点击按钮应该触发聊天导航', async () => {
    mount();

    await fireEvent.click(screen.getByTestId('chat-button-chat-1'));

    expect(routerMock.navigateToChat).toHaveBeenCalledWith({ chatId: 'chat-1' });
  });

  it('点击菜单按钮不应该触发导航', async () => {
    mount();

    await fireEvent.click(screen.getByTestId('chat-menu-trigger'));

    expect(routerMock.navigateToChat).not.toHaveBeenCalled();
  });

  it('删除应该经过确认对话框并在确认后调用 store', async () => {
    const chatStore = useChatStore();
    const deleteSpy = vi.spyOn(chatStore, 'deleteChat').mockResolvedValue();

    mount();
    await fireEvent.click(screen.getByTestId('chat-menu-trigger'));
    await fireEvent.click(screen.getByText('删除'));

    expect(confirmMock.warning).toHaveBeenCalled();
    const options = confirmMock.warning.mock.calls[0][0];
    await options.onOk();

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  it('重命名应该调用 editChatName 并提示成功', async () => {
    const chatStore = useChatStore();
    const editSpy = vi
      .spyOn(chatStore, 'editChatName')
      .mockResolvedValue();

    mount();
    await fireEvent.click(screen.getByTestId('chat-menu-trigger'));
    await fireEvent.click(screen.getByText('重命名'));

    const input = screen.getByRole('textbox');
    await fireEvent.update(input, '新名字');
    await fireEvent.click(screen.getByLabelText('确定'));

    await waitFor(() => {
      expect(editSpy).toHaveBeenCalledWith({ id: 'chat-1', name: '新名字' });
    });
  });

  it('重命名相同名称时应该直接取消', async () => {
    const chatStore = useChatStore();
    const editSpy = vi.spyOn(chatStore, 'editChatName').mockResolvedValue();

    mount();
    await fireEvent.click(screen.getByTestId('chat-menu-trigger'));
    await fireEvent.click(screen.getByText('重命名'));

    await fireEvent.click(screen.getByLabelText('确定'));

    expect(editSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

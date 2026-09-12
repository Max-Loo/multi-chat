/**
 * Vue PanelHeader 组件测试
 *
 * 对应 React 版 ChatPanelHeader.test.tsx 的行为断言：
 * 列数调整（spinbutton/min/max/加减按钮）、分割模式开关、单多模型分支、
 * 侧边栏展开按钮、聊天名称展示与 isShowChatPage 生命周期标记。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent } from '@testing-library/vue';

// Mock vue-router（useCreateChat 依赖）
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock 响应式适配（桌面端）
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => globalThis.__createResponsiveMock(),
}));

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: {
      unnamed: '未命名',
      enableSplitter: '启用分割模式',
      maxPerRow: '每行最多',
      itemsUnit: '项',
      showSidebar: '显示侧边栏',
      createChat: '创建聊天',
    },
    navigation: { openChatList: '打开聊天列表', createChat: '新建聊天' },
  }));

import PanelHeader from '@/pages/Chat/components/Panel/PanelHeader.vue';
import { useChatStore } from '@/store/pinia/chat';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { createMockChat, createMockChatWithModels } from '@/__test__/helpers/mocks/chatSidebar';

/** 在 Pinia store 中注入选中聊天 */
const injectSelectedChat = (chat: ReturnType<typeof createMockChat>) => {
  const chatStore = useChatStore();
  chatStore.selectedChatId = chat.id;
  chatStore.activeChatData = { [chat.id]: chat };
};

describe('PanelHeader（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('显示当前列数值', () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    expect(screen.getByRole('spinbutton')).toBeTruthy();
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('2');
  });

  it('通过输入框调整列数并向上发送事件', async () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    const { emitted } = render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    // v-model 监听 input 事件
    await fireEvent.input(screen.getByRole('spinbutton'), { target: { value: '3' } });

    expect(emitted()['update:columnCount']).toBeTruthy();
    expect(emitted()['update:columnCount'][0]).toEqual([3]);
  });

  it('输入框 max 属性等于模型数量', () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    expect((screen.getByRole('spinbutton') as HTMLInputElement).max).toBe('2');
  });

  it('输入框 min 属性为 1', () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    expect((screen.getByRole('spinbutton') as HTMLInputElement).min).toBe('1');
  });

  it('显示每行最大数标签与单位标签', () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    expect(screen.getByText('每行最多')).toBeVisible();
    expect(screen.getByText('项')).toBeVisible();
  });

  it('显示分割模式开关并在切换时向上发送事件', async () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    const { emitted } = render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    const sw = screen.getByTestId('splitter-switch');
    expect(sw).toBeTruthy();

    await fireEvent.click(sw);

    expect(emitted()['update:isSplitter']).toBeTruthy();
    expect(emitted()['update:isSplitter'][0]).toEqual([true]);
  });

  it('开关正确反映 isSplitter 当前状态', () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    const unchecked = render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });
    expect(screen.getByTestId('splitter-switch').getAttribute('data-state')).toBe('unchecked');
    unchecked.unmount();

    render(PanelHeader, { props: { columnCount: 2, isSplitter: true } });
    expect(screen.getByTestId('splitter-switch').getAttribute('data-state')).toBe('checked');
  });

  it('显示分割模式标签', () => {
    injectSelectedChat(createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 2, isSplitter: false } });

    expect(screen.getByText('启用分割模式')).toBeVisible();
  });

  it('单模型时不显示分割控制', () => {
    injectSelectedChat(createMockChatWithModels(1, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 1, isSplitter: false } });

    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(document.querySelector('[data-testid="splitter-switch"]')).toBeNull();
  });

  it('多模型时显示分割控制并根据模型数量更新最大列数', () => {
    injectSelectedChat(createMockChatWithModels(3, { id: 'chat-1', name: 'Test Chat' }));

    render(PanelHeader, { props: { columnCount: 3, isSplitter: false } });

    expect(screen.getByTestId('splitter-switch')).toBeTruthy();
    expect((screen.getByRole('spinbutton') as HTMLInputElement).max).toBe('3');
  });

  it('侧边栏折叠时显示展开按钮，未折叠时不显示', async () => {
    injectSelectedChat(createMockChatWithModels(1, { id: 'chat-1', name: 'Test Chat' }));
    const chatPageStore = useChatPageStore();
    chatPageStore.isSidebarCollapsed = true;

    const first = render(PanelHeader, { props: { columnCount: 1, isSplitter: false } });
    expect(screen.getByTitle('显示侧边栏')).toBeTruthy();
    first.unmount();

    chatPageStore.isSidebarCollapsed = false;
    render(PanelHeader, { props: { columnCount: 1, isSplitter: false } });
    expect(screen.queryByTitle('显示侧边栏')).toBeNull();
  });

  it('显示聊天名称', () => {
    injectSelectedChat(createMockChat({ id: 'chat-1', name: 'My Awesome Chat', chatModelList: [] }));

    render(PanelHeader, { props: { columnCount: 1, isSplitter: false } });

    expect(screen.getByText('My Awesome Chat')).toBeVisible();
  });

  it('未命名聊天显示默认文本', () => {
    injectSelectedChat(createMockChat({ id: 'chat-1', name: '', chatModelList: [] }));

    render(PanelHeader, { props: { columnCount: 1, isSplitter: false } });

    expect(screen.getByText('未命名')).toBeVisible();
  });

  it('挂载与卸载时更新 isShowChatPage 标记', async () => {
    injectSelectedChat(createMockChatWithModels(1, { id: 'chat-1', name: 'Test Chat' }));
    const chatPageStore = useChatPageStore();

    const { unmount } = render(PanelHeader, { props: { columnCount: 1, isSplitter: false } });
    expect(chatPageStore.isShowChatPage).toBe(true);

    unmount();
    expect(chatPageStore.isShowChatPage).toBe(false);
  });
});

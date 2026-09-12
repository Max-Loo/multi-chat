/**
 * Vue Panel 编排组件测试
 *
 * 对应 React 版 ChatPanel.test.tsx 的行为断言：
 * 单/多模型渲染分支、Grid 与 Splitter 布局切换、columnCount 状态管理、
 * 聊天模型变化时重置分割模式，以及边界情况（0 模型、空名称）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { nextTick } from 'vue';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock 虚拟滚动（Detail 内部使用）
vi.mock('virtua/vue', () => ({
  Virtualizer: {
    name: 'Virtualizer',
    props: ['data', 'startMargin', 'scrollRef'],
    emits: ['scroll'],
    template: `<div><template v-for="(item, i) in (data ?? [])" :key="i"><slot :item="item" :index="i" /></template></div>`,
  },
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
      typeMessage: '请输入消息...',
      sendMessage: '发送消息',
      stopSending: '停止发送',
      transmitHistoryReasoning: '包含推理内容',
      transmitHistoryReasoningHint: '推理内容提示',
    },
    common: { confirm: '确认' },
    navigation: { openChatList: '打开聊天列表', createChat: '新建聊天' },
  }));

import Panel from '@/pages/Chat/components/Panel/Panel.vue';
import { useChatStore } from '@/store/pinia/chat';
import { useModelStore } from '@/store/pinia/model';
import { createMockChatWithModels, createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

/** 注入选中聊天（含 n 个模型）并补充模型详情 */
const injectSelectedChat = (chat: ReturnType<typeof createMockChatWithModels>) => {
  const chatStore = useChatStore();
  chatStore.selectedChatId = chat.id;
  chatStore.activeChatData = { [chat.id]: chat };
  chatStore.runningChat = {};

  const modelStore = useModelStore();
  modelStore.models = (chat.chatModelList ?? []).map((m, i) =>
    createMockModel({ id: m.modelId, nickname: `Model ${i}`, modelName: `model-name-${i}` }),
  );
};

describe('Panel（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('单模型聊天渲染面板/头部/网格/发送框且无分割控制', async () => {
    injectSelectedChat(createMockChatWithModels(1, { id: 'chat-1', name: 'Solo Chat' }));

    render(Panel);
    await waitFor(() => expect(document.querySelector('[data-testid="grid-container"]')).not.toBeNull());

    expect(screen.getByTestId('chat-panel')).toBeVisible();
    expect(screen.getByTestId('chat-panel-header')).toBeVisible();
    expect(screen.getByTestId('chat-panel-sender')).toBeVisible();
    expect(document.querySelector('[data-testid="splitter-switch"]')).toBeNull();
  });

  it('多模型聊天显示分割控制与列数控制', async () => {
    injectSelectedChat(createMockChatWithModels(3, { id: 'chat-1', name: 'Multi Chat' }));

    render(Panel);
    await waitFor(() => expect(document.querySelector('[data-testid="grid-container"]')).not.toBeNull());

    expect(document.querySelector('[data-testid="splitter-switch"]')).not.toBeNull();
    expect(screen.getByTestId('column-plus-btn')).toBeTruthy();
    expect(screen.getByTestId('column-minus-btn')).toBeTruthy();
    expect((screen.getByTestId('column-count-input') as HTMLInputElement).value).toBe('3');
  });

  it('初始为网格布局，开启开关后切换为 Splitter 布局', async () => {
    injectSelectedChat(createMockChatWithModels(3, { id: 'chat-1', name: 'Multi Chat' }));

    render(Panel);
    await waitFor(() => expect(document.querySelector('[data-testid="grid-container"]')).not.toBeNull());
    expect(document.querySelector('[data-testid="splitter-container"]')).toBeNull();

    await fireEvent.click(screen.getByTestId('splitter-switch'));

    await waitFor(() => expect(document.querySelector('[data-testid="splitter-container"]')).not.toBeNull());
    expect(document.querySelector('[data-testid="grid-container"]')).toBeNull();
  });

  it('columnCount 通过加减按钮管理且有上下限', async () => {
    injectSelectedChat(createMockChatWithModels(3, { id: 'chat-1', name: 'Multi Chat' }));

    render(Panel);
    await waitFor(() => expect(screen.getByTestId('column-count-input')).toBeTruthy());

    // 3 → 减 → 2
    await fireEvent.click(screen.getByTestId('column-minus-btn'));
    expect((screen.getByTestId('column-count-input') as HTMLInputElement).value).toBe('2');

    // 2 → 加 → 3
    await fireEvent.click(screen.getByTestId('column-plus-btn'));
    expect((screen.getByTestId('column-count-input') as HTMLInputElement).value).toBe('3');

    // 加到上限 3 后按钮禁用
    expect((screen.getByTestId('column-plus-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  it('切换聊天模型列表后重置分割模式', async () => {
    const chatStore = useChatStore();
    injectSelectedChat(createMockChatWithModels(3, { id: 'chat-1', name: 'Multi Chat' }));

    render(Panel);
    await waitFor(() => expect(screen.getByTestId('splitter-switch')).toBeTruthy());

    // 开启 Splitter
    await fireEvent.click(screen.getByTestId('splitter-switch'));
    await waitFor(() => expect(document.querySelector('[data-testid="splitter-container"]')).not.toBeNull());

    // 模型列表变化（编辑聊天）→ isSplitter 重置 → 回到网格布局
    chatStore.activeChatData = {
      ...chatStore.activeChatData,
      'chat-1': createMockChatWithModels(3, { id: 'chat-1', name: 'Multi Chat' }),
    };
    await nextTick();

    await waitFor(() => {
      expect(screen.getByTestId('splitter-switch').getAttribute('data-state')).toBe('unchecked');
    });
  });

  it('0 模型聊天不崩溃且网格为空', async () => {
    const chatStore = useChatStore();
    const chat = createMockChat({ id: 'chat-1', name: '', chatModelList: [] });
    chatStore.selectedChatId = chat.id;
    chatStore.activeChatData = { [chat.id]: chat };

    render(Panel);
    await waitFor(() => expect(screen.getByTestId('chat-panel')).toBeVisible());

    expect(screen.getByTestId('chat-panel-header')).toBeVisible();
    expect(screen.getByText('未命名')).toBeVisible();
    await waitFor(() => expect(document.querySelector('[data-testid="grid-container"]')).not.toBeNull());
    expect(screen.queryByTestId('chat-model-panel')).toBeNull();
  });
});

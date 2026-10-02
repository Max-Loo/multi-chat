/**
 * ChatPanel 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/components/ChatPanel.test.tsx，保留核心行为语义：
 * - 单模型/多模型布局渲染
 * - columnCount 列数状态管理（切分行列）
 * - isSplitter 切换网格与分屏布局
 * - chatModelList 变化时重置分割模式
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
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

// Mock Detail：聚焦 Panel 的布局组合逻辑
vi.mock('@/pages/Chat/components/Panel/Detail/Detail.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['chatModel'],
    template:
      '<div data-testid="mock-detail" :data-model-id="chatModel.modelId" />',
  },
}));

// Mock Splitter（异步组件）与 Sender，聚焦布局切换
vi.mock('@/pages/Chat/components/Panel/Splitter.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['board'],
    template:
      '<div data-testid="mock-splitter"><div v-for="(row, i) in board" :key="i"><span v-for="m in row" :key="m.modelId" :data-model-id="m.modelId" /></div></div>',
  },
}));
vi.mock('@/pages/Chat/components/Panel/Sender.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    template: '<div data-testid="mock-sender" />',
  },
}));

import Panel from '@/pages/Chat/components/Panel/Panel.vue';
import { createAppPinia, useChatStore } from '@/stores';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';
import type { Chat, ChatModel } from '@/types/chat';

const CHAT_ID = 'chat-panel-test';

/** 创建多模型聊天 */
function createChat(models: ChatModel[]): Chat {
  return {
    id: CHAT_ID,
    name: '面板测试聊天',
    chatModelList: models,
    isDeleted: false,
  };
}

interface RenderOptions {
  models: ChatModel[];
}

/** 渲染 Panel（准备选中聊天） */
function renderPanel(options: RenderOptions) {
  const pinia = createAppPinia();
  const chatStore = useChatStore(pinia);
  const chat = createChat(options.models);
  chatStore.chatMetaList = [{ id: CHAT_ID, name: chat.name, modelIds: [], isDeleted: false }];
  chatStore.activeChatData = { [CHAT_ID]: chat };
  chatStore.selectedChatId = CHAT_ID;

  const result = render(Panel, { global: { plugins: [pinia] } });
  return { ...result, chatStore };
}

describe('ChatPanel（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该渲染单模型聊天面板且不显示分割控制', () => {
    renderPanel({ models: [createMockPanelChatModel('m1')] });

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-detail')).toHaveLength(1);
    expect(
      screen.queryByTestId('splitter-switch'),
    ).not.toBeInTheDocument();
  });

  it('应该渲染多模型网格布局（初始每行列数为模型数量）', () => {
    renderPanel({
      models: [
        createMockPanelChatModel('m1'),
        createMockPanelChatModel('m2'),
        createMockPanelChatModel('m3'),
        createMockPanelChatModel('m4'),
      ],
    });

    // columnCount 初始化为模型数量 → 全部单行展示
    expect(screen.getAllByTestId('mock-detail')).toHaveLength(4);
    expect(screen.getAllByTestId('grid-row')).toHaveLength(1);
  });

  it('应该通过 Header 调整列数重新切分网格', async () => {
    renderPanel({
      models: [
        createMockPanelChatModel('m1'),
        createMockPanelChatModel('m2'),
      ],
    });
    expect(screen.getAllByTestId('grid-row')).toHaveLength(1);

    // 增加 columnCount 到 2 后仍是 1 行；将 columnCount 减为 1 → 2 行
    await fireEvent.update(screen.getByTestId('column-count-input'), '1');

    await waitFor(() => {
      expect(screen.getAllByTestId('grid-row')).toHaveLength(2);
    });
  });

  it('应该在开启分割模式时渲染 Splitter 布局', async () => {
    renderPanel({
      models: [
        createMockPanelChatModel('m1'),
        createMockPanelChatModel('m2'),
      ],
    });

    await fireEvent.click(screen.getByTestId('splitter-switch'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-splitter')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('grid-row')).not.toBeInTheDocument();
  });

  it('应该限制列数最大值为模型数量', () => {
    renderPanel({
      models: [
        createMockPanelChatModel('m1'),
        createMockPanelChatModel('m2'),
      ],
    });

    expect(screen.getByTestId('column-plus-btn')).toHaveAttribute('disabled');
  });

  it('应该在模型数量变化时重置分割模式', async () => {
    const { chatStore } = renderPanel({
      models: [
        createMockPanelChatModel('m1'),
        createMockPanelChatModel('m2'),
      ],
    });

    // 开启 Splitter
    await fireEvent.click(screen.getByTestId('splitter-switch'));
    await waitFor(() => {
      expect(screen.getByTestId('mock-splitter')).toBeInTheDocument();
    });

    // 切换到只有 1 个模型的聊天 → isSplitter 重置，回到 Grid
    chatStore.activeChatData[CHAT_ID] = createChat([
      createMockPanelChatModel('m1'),
    ]);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-splitter')).not.toBeInTheDocument();
    });
  });
});

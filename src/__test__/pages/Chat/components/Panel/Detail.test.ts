/**
 * Detail 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/Panel/Detail/index.test.tsx，
 * 保留核心行为语义：
 * - 虚拟化渲染（可见范围外消息不渲染）
 * - Title 始终渲染
 * - 流式消息并入渲染列表 / 无流式数据不渲染
 * - 错误 Alert 显隐
 * - 回到底部按钮显隐
 * - 流式自动跟随（在底部时跟随、上滚后不跟随）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';

// ========================================
// Mock 模块配置
// ========================================

const virtuaRef = vi.hoisted(() => ({
  factory: null as null | {
    scrollTo: (index: number) => void;
    getRenderedRange: () => { startIndex: number; endIndex: number };
  },
}));

vi.mock('virtua/vue', async () => {
  const { createVirtuaVueMock } = await import(
    '@/__test__/helpers/mocks/virtuaVue'
  );
  const factory = createVirtuaVueMock({
    viewportHeight: 600,
    itemHeight: 80,
    overscan: 2,
  });
  virtuaRef.factory = factory;
  return { Virtualizer: factory.MockVirtualizer, VList: factory.MockVList };
});

vi.mock('@/composables/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => globalThis.__createScrollbarMock(),
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

// Mock ChatBubble：Detail 测试聚焦列表组合逻辑（数量/追加），气泡内部渲染有专项测试
vi.mock('@/components/chat/ChatBubble.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['role', 'messageId', 'isRunning'],
    template:
      '<div :data-testid="role === \'user\' ? \'user-message\' : \'assistant-message\'" :data-message-id="messageId" />',
  },
}));

import Detail from '@/pages/Chat/components/Panel/Detail/Detail.vue';
import { createAppPinia, useModelStore } from '@/stores';
import { useChatStore } from '@/stores';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';
import { createMockPanelMessage } from '@/__test__/helpers/fixtures/chatPanelMessages';
import { mockContainerMetrics } from '@/__test__/helpers/mocks/scrollMetrics';
import { ChatRoleEnum, type StandardMessage } from '@/types/chat';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { Model } from '@/types/model';

const CHAT_ID = 'chat-detail-test-1';
const MODEL_ID = 'model-detail-test-1';

/** 创建 Detail 测试用的模型记录 */
function createDetailModel(overrides?: Partial<Model>): Model {
  return {
    id: MODEL_ID,
    nickname: 'Test Nickname',
    modelName: 'Test Model',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'TestProvider',
    isDeleted: false,
    isEnable: true,
    createdAt: '2026-01-01 00:00:00',
    updateAt: '2026-01-01 00:00:00',
    modelKey: 'test-model-key',
    apiKey: 'test-api-key',
    apiAddress: 'https://test.api',
    ...overrides,
  };
}

/** 准备 store：选中聊天 + 模型记录 */
function setupStore(
  pinia: ReturnType<typeof createAppPinia>,
  options: { withModels?: boolean } = {},
) {
  const chatStore = useChatStore(pinia);
  chatStore.chatMetaList = [
    { id: CHAT_ID, name: '测试', modelIds: [], isDeleted: false },
  ];
  chatStore.selectedChatId = CHAT_ID;
  chatStore.activeChatData = {
    [CHAT_ID]: {
      id: CHAT_ID,
      name: '测试',
      chatModelList: [],
      isDeleted: false,
    },
  };
  if (options.withModels !== false) {
    useModelStore(pinia).models = [createDetailModel()];
  }
  return chatStore;
}

/** 批量创建消息 */
function createMessages(count: number): StandardMessage[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPanelMessage({
      id: `msg-${i}`,
      role: i % 2 === 0 ? ChatRoleEnum.USER : ChatRoleEnum.ASSISTANT,
      content: `Message ${i}`,
    }),
  );
}

interface RenderOptions {
  messages?: StandardMessage[];
  runningChat?: {
    isSending: boolean;
    history: StandardMessage | null;
    errorMessage?: string;
  };
}

/** 渲染 Detail */
function renderDetail(options: RenderOptions = {}) {
  const pinia = createAppPinia();
  const chatStore = setupStore(pinia);
  const chatModel = createMockPanelChatModel(MODEL_ID, {
    chatHistoryList: options.messages ?? [],
  });

  if (options.runningChat) {
    chatStore.runningChat = {
      [CHAT_ID]: { [MODEL_ID]: options.runningChat },
    };
  }

  const result = render(Detail, {
    props: { chatModel },
    global: { plugins: [pinia] },
  });
  return { ...result, chatStore };
}

/** 获取滚动容器 */
function getScrollContainer() {
  return screen.getByTestId('detail-scroll-container');
}

describe('Detail 组件（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('虚拟化渲染', () => {
    it('应该只渲染可见范围内的消息 当历史记录很多', () => {
      renderDetail({ messages: createMessages(50) });

      // viewportHeight=600, itemHeight=80, overscan=2：可见 8 + 2 = 10 个
      const bubbles = screen
        .queryAllByTestId('user-message')
        .concat(screen.queryAllByTestId('assistant-message'));
      expect(bubbles.length).toBeLessThan(50);
      expect(bubbles.length).toBeLessThanOrEqual(10);
    });

    it('应该渲染所有消息 当消息数量在可视范围内', () => {
      renderDetail({ messages: createMessages(3) });

      const bubbles = screen
        .queryAllByTestId('user-message')
        .concat(screen.queryAllByTestId('assistant-message'));
      expect(bubbles.length).toBe(3);
    });
  });

  describe('Title 始终渲染', () => {
    it('应该始终渲染 Title 当消息列表变化', () => {
      renderDetail({ messages: createMessages(50) });

      // Title 在 Virtualizer 外部，始终渲染模型名称（nickname (modelName)）
      expect(
        screen.getByText('Test Nickname (Test Model)'),
      ).toBeInTheDocument();
    });
  });

  describe('流式消息渲染', () => {
    it('应该在渲染列表中追加流式消息 当有流式数据', () => {
      renderDetail({
        messages: [],
        runningChat: {
          isSending: true,
          history: createMockPanelMessage({
            role: ChatRoleEnum.ASSISTANT,
            content: 'Streaming content',
          }),
        },
      });

      const bubbles = screen.queryAllByTestId('assistant-message');
      expect(bubbles.length).toBe(1);
    });

    it('应该不显示流式消息 当没有流式数据', () => {
      renderDetail({ messages: [] });

      const bubbles = screen
        .queryAllByTestId('user-message')
        .concat(screen.queryAllByTestId('assistant-message'));
      expect(bubbles.length).toBe(0);
    });
  });

  describe('错误 Alert 显示', () => {
    it('应该显示错误 Alert 当存在错误消息', () => {
      renderDetail({
        messages: [],
        runningChat: {
          isSending: false,
          history: null,
          errorMessage: '发送失败：网络错误',
        },
      });

      expect(screen.getByText('发送失败：网络错误')).toBeInTheDocument();
    });

    it('应该不显示错误 Alert 当没有错误消息', () => {
      renderDetail({ messages: [] });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('回到底部按钮', () => {
    it('应该显示回到底部按钮 当内容超出视口且不在底部', async () => {
      renderDetail({ messages: createMessages(50) });
      const scrollContainer = getScrollContainer();

      // 设置容器指标：内容超出、不在底部
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 0,
      });

      // 触发 Virtualizer scroll 回调，重新检测滚动状态
      virtuaRef.factory?.scrollTo(0);

      await waitFor(() => {
        expect(screen.getByTitle('滚动到底部')).toBeInTheDocument();
      });
    });

    it('应该隐藏回到底部按钮 当在底部', async () => {
      renderDetail({ messages: createMessages(50) });
      const scrollContainer = getScrollContainer();

      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 1380,
      });

      virtuaRef.factory?.scrollTo(0);

      await waitFor(() => {
        expect(screen.queryByTitle('滚动到底部')).not.toBeInTheDocument();
      });
    });

    it('应该隐藏回到底部按钮 当内容不需要滚动', async () => {
      renderDetail({ messages: createMessages(3) });
      const scrollContainer = getScrollContainer();

      mockContainerMetrics(scrollContainer, {
        scrollHeight: 600,
        clientHeight: 600,
        scrollTop: 0,
      });

      virtuaRef.factory?.scrollTo(0);

      await waitFor(() => {
        expect(screen.queryByTitle('滚动到底部')).not.toBeInTheDocument();
      });
    });
  });

  describe('流式自动跟随', () => {
    it('应该自动滚到底部 当流式更新且用户在底部', async () => {
      const { chatStore } = renderDetail({
        messages: createMessages(20),
        runningChat: { isSending: true, history: null },
      });
      const scrollContainer = getScrollContainer();

      // 设置容器指标：用户在底部（2000 - 1380 - 600 = 20 ≤ 24 阈值）
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 1380,
      });
      virtuaRef.factory?.scrollTo(0);

      // 流式更新触发跟随 effect（watch pre-flush → 组件注册 rAF → 下一帧执行 scrollToIndex）
      chatStore.pushRunningChatHistory(
        { id: CHAT_ID } as Parameters<typeof chatStore.pushRunningChatHistory>[0],
        { id: MODEL_ID } as Parameters<typeof chatStore.pushRunningChatHistory>[1],
        createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Updated streaming content',
        }),
      );
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );

      // scrollToIndex(align: 'end') 在 mock 中将 scrollTop 置为 scrollHeight
      expect(scrollContainer.scrollTop).toBe(2000);
    });

    it('应该不自动滚动 当流式更新但用户已向上滚动', async () => {
      const { chatStore } = renderDetail({
        messages: createMessages(20),
        runningChat: { isSending: true, history: null },
      });
      const scrollContainer = getScrollContainer();

      // 用户不在底部（scrollTop=0）
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 0,
      });
      virtuaRef.factory?.scrollTo(0);

      const scrollTopBefore = scrollContainer.scrollTop;
      chatStore.pushRunningChatHistory(
        { id: CHAT_ID } as Parameters<typeof chatStore.pushRunningChatHistory>[0],
        { id: MODEL_ID } as Parameters<typeof chatStore.pushRunningChatHistory>[1],
        createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Updated streaming content',
        }),
      );
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );

      expect(scrollContainer.scrollTop).toBe(scrollTopBefore);
    });
  });

  describe('模型名称显示', () => {
    it('应该在 store 无模型时显示「模型已删除」Badge', () => {
      const pinia = createAppPinia();
      setupStore(pinia, { withModels: false });
      const chatModel = createMockPanelChatModel(MODEL_ID);

      render(Detail, {
        props: { chatModel },
        global: { plugins: [pinia] },
      });

      expect(screen.getByText('模型已删除')).toBeInTheDocument();
    });

    it('应该在 store 有模型时显示模型名与供应商', () => {
      const pinia = createAppPinia();
      setupStore(pinia);
      const chatModel = createMockPanelChatModel(MODEL_ID);

      render(Detail, {
        props: { chatModel },
        global: { plugins: [pinia] },
      });

      expect(
        screen.getByText('Test Nickname (Test Model)'),
      ).toBeInTheDocument();
    });
  });
});

/**
 * Detail 组件单元测试
 *
 * 测试目标：验证 Detail 消息列表组件的核心行为
 *
 * 技术方案：
 * - 使用 renderWithProviders + 真实 Redux store 渲染完整组件树
 * - Mock 系统边界（virtua、useAdaptiveScrollbar、useTranslation、ResizeObserver）
 * - 通过 Redux store 的 preloadedState 控制组件行为
 */

import { screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Detail from '@/pages/Chat/components/Panel/Detail';
import { mockContainerMetrics } from '@/__test__/helpers/mocks/scrollMetrics';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';
import { renderWithProviders } from '@/__test__/helpers/render/redux';
import { ChatRoleEnum, type StandardMessage, type Chat, type ChatModel } from '@/types/chat';
import { ModelProviderKeyEnum } from '@/utils/enums';

// ========================================
// Mock 模块配置
// ========================================

/**
 * 使用 vi.hoisted 创建 mock 引用，vi.mock async factory 中通过 import 引入共享工厂
 * vi.hoisted 先创建占位对象，vi.mock factory 在模块首次导入时异步加载 createVirtuaMock
 * 并填充占位对象的方法，测试运行时占位对象已包含完整的 mock 方法
 */
const { mock } = vi.hoisted(() => {
  const virtuaMock = {
    scrollTo: (_i: number) => {},
    getRenderedRange: () => ({ startIndex: 0, endIndex: 0 }),
  };
  return { mock: virtuaMock };
});

vi.mock('virtua', async () => {
  const { createVirtuaMock } = await import('../../helpers/mocks/virtua');
  const factory = createVirtuaMock();
  mock.scrollTo = factory.scrollTo;
  mock.getRenderedRange = factory.getRenderedRange;
  return { Virtualizer: factory.MockVirtualizer, VList: factory.MockVList };
});

vi.mock('@/hooks/useAdaptiveScrollbar', () => ({ useAdaptiveScrollbar: () => globalThis.__createScrollbarMock() }));

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: {
      scrollToBottom: '回到底部',
    },
  }));

// ========================================
// 测试常量和辅助函数
// ========================================

const CHAT_ID = 'chat-detail-test-1';
const MODEL_ID = 'model-detail-test-1';
const MODEL_NAME = 'Test Model';

/** 创建默认的 preloadedState */
function createDefaultPreloadedState(overrides?: {
  messages?: StandardMessage[]
  runningChat?: Record<string, Record<string, { isSending: boolean; history: StandardMessage | null; errorMessage?: string }>>
}) {
  const messages = overrides?.messages ?? [];
  const chatModel: ChatModel = createMockPanelChatModel(MODEL_ID, {
    chatHistoryList: messages,
  });

  const chat: Chat = {
    id: CHAT_ID,
    chatModelList: [chatModel],
  };

  return {
    chat: {
      chatMetaList: [{
        id: CHAT_ID,
        name: undefined,
        modelIds: [MODEL_ID],
        isDeleted: false,
      }],
      activeChatData: {
        [CHAT_ID]: chat,
      },
      sendingChatIds: {},
      selectedChatId: CHAT_ID,
      loading: false,
      error: null,
      initializationError: null,
      runningChat: overrides?.runningChat ?? {},
    },
    models: {
      models: [{
        id: MODEL_ID,
        nickname: 'Test Nickname',
        modelName: MODEL_NAME,
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        providerName: 'TestProvider',
        isDeleted: false,
        isEnable: true,
        createdAt: '2026-01-01 00:00:00',
        updateAt: '2026-01-01 00:00:00',
        modelKey: 'test-model-key',
        apiKey: 'test-api-key',
        apiAddress: 'https://test.api',
      }],
      loading: false,
      error: null,
      initializationError: null,
    },
  };
}

/** 批量创建消息 */
function createMessages(count: number): StandardMessage[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPanelMessage({
      id: `msg-${i}`,
      role: i % 2 === 0 ? ChatRoleEnum.USER : ChatRoleEnum.ASSISTANT,
      content: `Message ${i}`,
    })
  );
}

/** 渲染 Detail 组件的辅助函数 */
function renderDetail(overrides?: Parameters<typeof createDefaultPreloadedState>[0]) {
  const chatModel = createMockPanelChatModel(MODEL_ID, {
    chatHistoryList: overrides?.messages ?? [],
  });
  return renderWithProviders(<Detail chatModel={chatModel} />, {
    preloadedState: createDefaultPreloadedState(overrides),
  });
}

/** 获取滚动容器 DOM */
function getScrollContainer(container: HTMLElement) {
  // Detail 最外层为 Fragment，第一个子元素即 scrollContainerRef 挂载的 div
  return container.firstElementChild as HTMLElement;
}

/** 等待 checkScrollStatus 完成（双层 rAF，约 32ms，留足余量用 50ms） */
async function waitForCheckScroll() {
  await act(async () => {
    vi.advanceTimersByTime(50);
  });
}

// ========================================
// 测试用例
// ========================================

describe('Detail Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 重置 virtua mock 状态到初始可见范围
    mock.scrollTo(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * 测试虚拟化渲染
   */
  describe('虚拟化渲染', () => {
    it('应该只渲染可见范围内的消息 当历史记录很多', () => {
      const messages = createMessages(50);
      renderDetail({ messages });

      // viewportHeight=600, itemHeight=80, overscan=2
      // 可见 8 个 + 2 个 overscan = 10 个
      const bubbles = screen.queryAllByTestId('user-message').concat(screen.queryAllByTestId('assistant-message'));
      expect(bubbles.length).toBeLessThan(50);
      expect(bubbles.length).toBeLessThanOrEqual(10);
    });

    it('应该渲染所有消息 当消息数量在可视范围内', () => {
      const messages = createMessages(3);
      renderDetail({ messages });

      const bubbles = screen.queryAllByTestId('user-message').concat(screen.queryAllByTestId('assistant-message'));
      expect(bubbles.length).toBe(3);
    });
  });

  /**
   * 测试 Title 始终渲染
   */
  describe('Title 始终渲染', () => {
    it('应该始终渲染 Title 当消息列表变化', () => {
      const messages = createMessages(50);
      renderDetail({ messages });

      // Title 在 Virtualizer 外部，始终渲染模型名称（格式：nickname (modelName)）
      expect(screen.getByText('Test Nickname (Test Model)')).toBeInTheDocument();
    });
  });

  /**
   * 测试 RunningBubble 渲染
   */
  describe('RunningBubble 渲染', () => {
    it('应该渲染 RunningBubble 在 Virtualizer 外部 当有流式数据', () => {
      renderDetail({
        messages: [],
        runningChat: {
          [CHAT_ID]: {
            [MODEL_ID]: {
              isSending: true,
              history: createMockPanelMessage({
                role: ChatRoleEnum.ASSISTANT,
                content: 'Streaming content',
              }),
            },
          },
        },
      });

      // RunningBubble 渲染 ChatBubble（流式内容），共 1 个 assistant-message
      // 同时虚拟化区域无历史消息
      const bubbles = screen.queryAllByTestId('assistant-message');
      expect(bubbles.length).toBe(1);
    });

    it('应该不显示 RunningBubble 当没有流式数据', () => {
      renderDetail({ messages: [] });

      // 无流式数据时，不应有 ChatBubble
      const bubbles = screen.queryAllByTestId('user-message').concat(screen.queryAllByTestId('assistant-message'));
      expect(bubbles.length).toBe(0);
    });
  });

  /**
   * 测试错误 Alert 显示
   */
  describe('错误 Alert 显示', () => {
    it('应该显示错误 Alert 当存在错误消息', () => {
      renderDetail({
        messages: [],
        runningChat: {
          [CHAT_ID]: {
            [MODEL_ID]: {
              isSending: false,
              history: null,
              errorMessage: '发送失败：网络错误',
            },
          },
        },
      });

      expect(screen.getByText('发送失败：网络错误')).toBeInTheDocument();
    });

    it('应该不显示错误 Alert 当没有错误消息', () => {
      renderDetail({ messages: [] });

      // 不应有 Alert 组件
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  /**
   * 测试回到底部按钮
   */
  describe('回到底部按钮', () => {
    it('应该显示回到底部按钮 当内容超出视口且不在底部', async () => {
      const { container } = renderDetail({ messages: createMessages(50) });
      const scrollContainer = getScrollContainer(container);

      // 先等待初始 checkScrollStatus 完成（它设置了 isCheckingScrollRef = true）
      await waitForCheckScroll();

      // 设置容器指标：内容超出、不在底部
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 0,
      });

      // 触发 onScroll 回调让组件读取容器属性
      mock.scrollTo(0);
      await waitForCheckScroll();

      // 断言按钮存在（通过 title 属性查找）
      expect(screen.getByTitle('回到底部')).toBeInTheDocument();
    });

    it('应该隐藏回到底部按钮 当在底部', async () => {
      const { container } = renderDetail({ messages: createMessages(50) });
      const scrollContainer = getScrollContainer(container);

      // 先等待初始 checkScrollStatus 完成
      await waitForCheckScroll();

      // 设置容器指标：在底部
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 1380,
      });

      mock.scrollTo(0);
      await waitForCheckScroll();

      expect(screen.queryByTitle('回到底部')).not.toBeInTheDocument();
    });

    it('应该隐藏回到底部按钮 当内容不需要滚动', async () => {
      const { container } = renderDetail({ messages: createMessages(3) });
      const scrollContainer = getScrollContainer(container);

      // 先等待初始 checkScrollStatus 完成
      await waitForCheckScroll();

      // 设置容器指标：内容不超出
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 600,
        clientHeight: 600,
        scrollTop: 0,
      });

      mock.scrollTo(0);
      await waitForCheckScroll();

      expect(screen.queryByTitle('回到底部')).not.toBeInTheDocument();
    });
  });

  /**
   * 测试流式自动跟随
   */
  describe('流式自动跟随', () => {
    it('应该自动滚到底部 当流式更新且用户在底部', async () => {
      const { container, store } = renderDetail({
        messages: createMessages(20),
        runningChat: {
          [CHAT_ID]: {
            [MODEL_ID]: {
              isSending: true,
              history: null,
            },
          },
        },
      });
      const scrollContainer = getScrollContainer(container);

      // 先等待初始 checkScrollStatus 完成
      await waitForCheckScroll();

      // 设置容器指标：用户在底部
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 1380,
      });

      // 触发 handleVirtualizerScroll，设置 shouldStickToBottom.current = true
      mock.scrollTo(0);
      await waitForCheckScroll();

      // 通过 raw dispatch 更新 runningChatData 触发流式跟随 effect
      const newMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Updated streaming content',
      });
      await act(async () => {
        store.dispatch({
          type: 'chat/pushRunningChatHistory',
          payload: {
            chat: { id: CHAT_ID },
            model: { id: MODEL_ID },
            message: newMessage,
          },
        });
      });
      // 流式自动跟随使用 rAF，需要等待 rAF 执行完毕
      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // 验证 scrollToBottom 效果：scrollTop 应变为 scrollHeight
      expect(scrollContainer.scrollTop).toBe(2000);
    });

    it('应该不自动滚动 当流式更新但用户已向上滚动', async () => {
      const { container, store } = renderDetail({
        messages: createMessages(20),
        runningChat: {
          [CHAT_ID]: {
            [MODEL_ID]: {
              isSending: true,
              history: null,
            },
          },
        },
      });
      const scrollContainer = getScrollContainer(container);

      // 先等待初始 checkScrollStatus 完成
      await waitForCheckScroll();

      // 设置容器指标：用户不在底部
      mockContainerMetrics(scrollContainer, {
        scrollHeight: 2000,
        clientHeight: 600,
        scrollTop: 0,
      });

      // 触发 handleVirtualizerScroll，shouldStickToBottom.current = false
      mock.scrollTo(0);
      await waitForCheckScroll();

      // 保存当前 scrollTop
      const scrollTopBefore = scrollContainer.scrollTop;

      // 通过 raw dispatch 更新 runningChatData
      const newMessage = createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Updated streaming content',
      });
      await act(async () => {
        store.dispatch({
          type: 'chat/pushRunningChatHistory',
          payload: {
            chat: { id: CHAT_ID },
            model: { id: MODEL_ID },
            message: newMessage,
          },
        });
      });

      // 验证 scrollToBottom 未执行：scrollTop 保持不变
      expect(scrollContainer.scrollTop).toBe(scrollTopBefore);
    });
  });
});

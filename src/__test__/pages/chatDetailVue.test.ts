/**
 * Vue Detail 组件测试
 *
 * 对应 React 版 ChatPanelContentDetail.test.tsx + DetailScroll.test.tsx 的行为断言：
 * 标题/气泡/错误/Spinner 渲染分支、滚动容器语义，以及「滚动到底部」按钮的显隐与点击行为。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent } from '@testing-library/vue';
import { nextTick } from 'vue';

// hoisted：供 vi.mock 工厂与测试体共享的 mock
const { scrollToIndexMock } = vi.hoisted(() => ({ scrollToIndexMock: vi.fn() }));

// Mock 虚拟滚动组件：直接渲染全部 data 项，并暴露 scrollToIndex 供断言
vi.mock('virtua/vue', () => ({
  Virtualizer: {
    name: 'Virtualizer',
    props: ['data', 'startMargin', 'scrollRef'],
    emits: ['scroll'],
    setup(_: unknown, { expose }: { expose: (api: Record<string, unknown>) => void }) {
      // 仅暴露 scrollToIndex；渲染交给下方 template（setup 返回渲染函数会忽略 template）
      expose({ scrollToIndex: scrollToIndexMock });
    },
    template: `<div class="virtualizer-mock"><template v-for="(item, i) in (data ?? [])" :key="i"><slot :item="item" :index="i" /></template></div>`,
  },
}));

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: { unnamed: '未命名', scrollToBottom: '滚动到底部' },
    common: { a11y: { chatMessages: '聊天消息' } },
  }));

import Detail from '@/pages/Chat/components/Panel/Detail/Detail.vue';
import { useChatStore } from '@/store/pinia/chat';
import { useModelStore } from '@/store/pinia/model';
import type { ChatModel, RunningChatEntry } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';

/** 构造带 n 条消息历史的 chatModel */
const createChatModelWithHistory = (count: number): ChatModel => ({
  ...createMockPanelChatModel('model-1'),
  chatHistoryList: Array.from({ length: count }, (_, i) =>
    createMockPanelMessage({
      id: `msg-${i}`,
      role: i % 2 === 0 ? ChatRoleEnum.USER : ChatRoleEnum.ASSISTANT,
      content: i % 2 === 0 ? `User message ${i + 1}` : `Assistant response ${i + 1}`,
    }),
  ),
});

/** 注入选中聊天与运行状态 */
const injectChatState = (chatModel: ChatModel, running?: RunningChatEntry) => {
  const chatStore = useChatStore();
  chatStore.selectedChatId = 'chat-1';
  chatStore.activeChatData = {
    'chat-1': {
      id: 'chat-1',
      name: 'Test Chat',
      isDeleted: false,
      chatModelList: [chatModel],
    },
  } as never;
  if (running) {
    chatStore.runningChat = { 'chat-1': { [chatModel.modelId]: running } } as never;
  }
};

/** 捕获 ResizeObserver 回调的桩 */
let resizeCallbacks: Array<{ cb: ResizeObserverCallback; el: Element }> = [];
class MockResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(el: Element) {
    resizeCallbacks.push({ cb: this.cb, el });
  }
  unobserve() {}
  disconnect() {}
}

/** 设置元素滚动容器尺寸指标 */
const setContainerMetrics = (el: Element, metrics: { scrollHeight: number; clientHeight: number; scrollTop: number }) => {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: metrics.scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: metrics.clientHeight });
  Object.defineProperty(el, 'scrollTop', { configurable: true, value: metrics.scrollTop });
};

/** 触发指定容器上注册的 ResizeObserver 回调 */
const triggerResize = (el: Element) => {
  for (const { cb, el: observed } of resizeCallbacks) {
    if (observed === el) {
      cb([], {} as ResizeObserver);
    }
  }
};

describe('Detail（Vue 版）渲染分支', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    scrollToIndexMock.mockClear();
  });

  it('渲染历史消息气泡', () => {
    injectChatState(createChatModelWithHistory(4));

    render(Detail, { props: { chatModel: createChatModelWithHistory(4) } });

    const userBubbles = screen.getAllByTestId('user-message');
    const assistantBubbles = screen.getAllByTestId('assistant-message');
    expect(userBubbles.length + assistantBubbles.length).toBe(4);
  });

  it('渲染 DetailTitle 与消息文本', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: 'Model 1', modelName: 'Model 1', providerKey: 'deepseek' as never, providerName: 'DeepSeek' }),
    ];
    injectChatState(createChatModelWithHistory(2));

    render(Detail, { props: { chatModel: createChatModelWithHistory(2) } });

    expect(screen.getByText('Model 1 (Model 1)')).toBeVisible();
    expect(screen.getByText('User message 1')).toBeVisible();
    expect(screen.getByText('Assistant response 2')).toBeVisible();
  });

  it('空历史列表正常渲染', () => {
    injectChatState(createMockPanelChatModel('model-1'));

    render(Detail, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.queryByTestId('user-message')).toBeNull();
    expect(screen.queryByTestId('assistant-message')).toBeNull();
  });

  it('chatHistoryList 为 null/undefined 时不崩溃', () => {
    const broken = { modelId: 'model-1', chatHistoryList: null } as unknown as ChatModel;
    injectChatState(broken);

    expect(() => render(Detail, { props: { chatModel: broken } })).not.toThrow();
  });

  it('runningChatData 有 errorMessage 时显示错误信息', () => {
    injectChatState(createMockPanelChatModel('model-1'), {
      isSending: false,
      history: null,
      errorMessage: 'Network error occurred',
    });

    render(Detail, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByText('Network error occurred')).toBeVisible();
  });

  it('无错误时不渲染 alert', () => {
    injectChatState(createMockPanelChatModel('model-1'));

    render(Detail, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('发送中且尚无内容时显示 Spinner（role=status）', () => {
    injectChatState(createMockPanelChatModel('model-1'), {
      isSending: true,
      history: null,
    });

    render(Detail, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('非发送状态不渲染 Spinner', () => {
    injectChatState(createMockPanelChatModel('model-1'));

    render(Detail, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('滚动容器具有 role=log 与聊天消息标签', () => {
    injectChatState(createMockPanelChatModel('model-1'));

    render(Detail, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByRole('log', { name: '聊天消息' })).toBeTruthy();
    expect(screen.getByTestId('detail-scroll-container')).toBeTruthy();
  });
});

describe('Detail（Vue 版）滚动到底部按钮', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    scrollToIndexMock.mockClear();
    resizeCallbacks = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resizeCallbacks = [];
  });

  /** 渲染并触发初次尺寸检测 */
  const renderAndCheck = async (metrics: { scrollHeight: number; clientHeight: number; scrollTop: number }) => {
    const chatModel = createMockPanelChatModel('model-1');
    injectChatState(chatModel);
    const { container } = render(Detail, { props: { chatModel } });
    await nextTick();

    const scrollContainer = container.querySelector('[data-testid="detail-scroll-container"]')!;
    setContainerMetrics(scrollContainer, metrics);
    triggerResize(scrollContainer);
    await nextTick();
    return { container, scrollContainer };
  };

  it('内容超出容器且不在底部时显示按钮', async () => {
    await renderAndCheck({ scrollHeight: 1000, clientHeight: 300, scrollTop: 100 });

    expect(screen.getByRole('button', { name: '滚动到底部' })).toBeTruthy();
  });

  it('滚动到底部时隐藏按钮', async () => {
    // 1000 - 300 = 700，scrollTop 680 → 距底部 20 ≤ 24 阈值
    await renderAndCheck({ scrollHeight: 1000, clientHeight: 300, scrollTop: 680 });

    expect(screen.queryByRole('button', { name: '滚动到底部' })).toBeNull();
  });

  it('内容不超出容器时隐藏按钮', async () => {
    await renderAndCheck({ scrollHeight: 200, clientHeight: 300, scrollTop: 0 });

    expect(screen.queryByRole('button', { name: '滚动到底部' })).toBeNull();
  });

  it('点击按钮调用 scrollToIndex 滚动到最后一条', async () => {
    const { scrollContainer } = await renderAndCheck({ scrollHeight: 1000, clientHeight: 300, scrollTop: 100 });

    await fireEvent.click(screen.getByRole('button', { name: '滚动到底部' }));

    expect(scrollToIndexMock).toHaveBeenCalledWith(expect.any(Number), { align: 'end' });
    void scrollContainer;
  });

  it('通过 ResizeObserver 重新检测滚动状态', async () => {
    const { scrollContainer } = await renderAndCheck({ scrollHeight: 200, clientHeight: 300, scrollTop: 0 });
    expect(screen.queryByRole('button', { name: '滚动到底部' })).toBeNull();

    // 容器变矮后内容超出且不在底部 → 按钮出现
    setContainerMetrics(scrollContainer, { scrollHeight: 1000, clientHeight: 300, scrollTop: 100 });
    triggerResize(scrollContainer);
    await nextTick();

    expect(screen.getByRole('button', { name: '滚动到底部' })).toBeTruthy();
  });
});

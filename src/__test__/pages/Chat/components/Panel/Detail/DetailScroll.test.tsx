/**
 * Detail 组件滚动行为补充测试
 *
 * 补充 ChatPanelContentDetail.test.tsx 未覆盖的场景：
 * - 滚动到底部按钮显示/隐藏
 * - ResizeObserver 触发滚动状态重新检测
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, screen } from '@testing-library/react';
import Detail from '@/pages/Chat/components/Panel/Detail';
import { ChatModel, StandardMessage, ChatRoleEnum } from '@/types/chat';

// Mock hooks
const mockSelectedChat = { id: 'chat-1' };
const mockRunningChatModelData: Record<string, any> = {};

vi.mock('@/pages/Chat/hooks/useSelectedChat', () => ({
  useSelectedChat: () => ({ selectedChat: mockSelectedChat }),
}));

vi.mock('@/hooks/redux', () => ({
  useAppSelector: (selector: any) => selector({
    chat: {
      runningChat: { 'chat-1': { 'model-1': mockRunningChatModelData } },
    },
  }),
}));

vi.mock('@/pages/Chat/hooks/useIsSending', () => ({
  useIsSending: () => ({ isSending: false }),
}));

vi.mock('@/hooks/useAdaptiveScrollbar', () => ({ useAdaptiveScrollbar: () => globalThis.__createScrollbarMock({ scrollbarClassname: '' }) }));

// Mock 子组件
vi.mock('@/pages/Chat/components/Panel/Detail/Title', () => ({
  default: () => <div data-testid="detail-title" />,
}));

vi.mock('@/pages/Chat/components/Panel/Detail/RunningBubble', () => ({
  default: () => null,
}));

vi.mock('@/components/chat/ChatBubble', () => ({
  ChatBubble: ({ content, role }: any) => (
    <div data-testid={role === 'user' ? 'user-message' : 'assistant-message'}>{content}</div>
  ),
}));

// Mock virtua 虚拟滚动——真实 Virtualizer 在 jsdom/happy-dom 中不渲染子元素
vi.mock('virtua', async () => {
  const { createVirtuaMock } = await import('../../../../../helpers/mocks/virtua');
  const { MockVirtualizer, MockVList } = createVirtuaMock();
  return { Virtualizer: MockVirtualizer, VList: MockVList };
});

vi.mock('react-i18next', () => globalThis.__mockI18n());

/**
 * 创建带历史的 ChatModel
 */
function createChatModelWithHistory(messageCount: number): ChatModel {
  const messages: StandardMessage[] = Array.from({ length: messageCount }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? ChatRoleEnum.USER : ChatRoleEnum.ASSISTANT,
    content: `消息 ${i}`,
    timestamp: Date.now() / 1000,
    modelKey: 'test-model',
    finishReason: null,
  }));

  return {
    modelId: 'model-1',
    chatHistoryList: messages,
  } as ChatModel;
}

describe('Detail 滚动行为', () => {
  beforeEach(() => {
    Object.keys(mockRunningChatModelData).forEach((key) => delete mockRunningChatModelData[key]);
  });

  it('应该渲染聊天历史消息', () => {
    const chatModel = createChatModelWithHistory(3);

    render(<Detail chatModel={chatModel} />);

    const userMessages = screen.queryAllByTestId('user-message');
    const assistantMessages = screen.queryAllByTestId('assistant-message');
    expect(userMessages.length + assistantMessages.length).toBe(3);
  });

  it('应该显示错误信息 当 runningChatData 有 errorMessage', () => {
    mockRunningChatModelData.errorMessage = '请求失败';

    const chatModel = createChatModelWithHistory(0);

    render(<Detail chatModel={chatModel} />);

    expect(screen.getByText('请求失败')).toBeInTheDocument();
  });

  it('应该渲染 Title 组件', () => {
    const chatModel = createChatModelWithHistory(0);

    render(<Detail chatModel={chatModel} />);

    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });

  it('应该渲染空列表 当 chatHistoryList 为空数组', () => {
    const chatModel = createChatModelWithHistory(0);

    render(<Detail chatModel={chatModel} />);

    const userMessages = screen.queryAllByTestId('user-message');
    const assistantMessages = screen.queryAllByTestId('assistant-message');
    expect(userMessages.length + assistantMessages.length).toBe(0);
  });

  it('应该渲染 RunningBubble 组件', () => {
    const chatModel = createChatModelWithHistory(0);

    // RunningBubble mock 返回 null，此处仅验证不抛错
    expect(() => render(<Detail chatModel={chatModel} />)).not.toThrow();
  });

  it('应该设置滚动容器 ref', () => {
    const chatModel = createChatModelWithHistory(0);

    render(<Detail chatModel={chatModel} />);

    // 滚动容器存在
    const scrollContainer = screen.getByTestId('detail-scroll-container');
    expect(scrollContainer).toBeInTheDocument();
  });
});

/**
 * Detail 滚动到底部按钮补充测试
 *
 * 覆盖 spec 场景：
 * - 内容超出容器时显示按钮
 * - 滚动到底部后隐藏按钮
 * - 点击按钮滚动到底部
 * - ResizeObserver 触发滚动状态重新检测
 */

/**
 * 模拟滚动容器的尺寸属性
 */
function mockScrollDimensions(
  el: HTMLElement,
  opts: { scrollHeight: number; clientHeight: number; scrollTop: number }
) {
  Object.defineProperty(el, 'scrollHeight', { value: opts.scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: opts.clientHeight, configurable: true });
  Object.defineProperty(el, 'scrollTop', {
    value: opts.scrollTop,
    configurable: true,
    writable: true,
  });
}

describe('Detail 滚动到底部按钮', () => {
  let resizeCallbacks: Array<(entries: ResizeObserverEntry[], observer: ResizeObserver) => void> = [];
  let OriginalRO: typeof globalThis.ResizeObserver;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.keys(mockRunningChatModelData).forEach((key) => delete mockRunningChatModelData[key]);
    resizeCallbacks = [];

    // Mock ResizeObserver 以捕获回调
    OriginalRO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      cb: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
      constructor(cb: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void) {
        this.cb = cb;
        resizeCallbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  afterEach(() => {
    globalThis.ResizeObserver = OriginalRO;
    vi.useRealTimers();
  });

  /**
   * 渲染组件并推进初始 debounce（初始 mount 触发 checkScrollStatus → RAF → 100ms setTimeout）
   */
  function renderAndFlushInitial(chatModel: ChatModel) {
    const result = render(<Detail chatModel={chatModel} />);
    // 推进初始 RAF + 100ms debounce 重置
    act(() => {
      vi.advanceTimersByTime(200);
    });
    return result;
  }

  /**
   * 模拟滚动状态并通过 ResizeObserver 回调触发重新检测
   * （组件通过 ResizeObserver 而非原生 scroll 事件检测滚动状态）
   */
  function triggerScrollRecheck(scrollContainer: HTMLElement, opts: {
    scrollHeight: number;
    clientHeight: number;
    scrollTop: number;
  }) {
    mockScrollDimensions(scrollContainer, opts);
    act(() => {
      resizeCallbacks.forEach((cb) => cb([{ contentRect: { height: 0 } }] as any, null as any));
      vi.advanceTimersByTime(200);
    });
  }

  it('应该显示滚动到底部按钮 当内容超出容器且不在底部', () => {
    const chatModel = createChatModelWithHistory(3);
    renderAndFlushInitial(chatModel);

    const scrollContainer = screen.getByTestId('detail-scroll-container');

    // 模拟：内容 1000px，容器 300px，scrollTop=100 → 不在底部 (1000-100-300=600 > 24)
    triggerScrollRecheck(scrollContainer, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });

    const button = screen.getByRole('button', { name: '滚动到底部' });
    expect(button).toBeInTheDocument();
  });

  it('应该隐藏按钮 当滚动到底部', () => {
    const chatModel = createChatModelWithHistory(3);
    renderAndFlushInitial(chatModel);

    const scrollContainer = screen.getByTestId('detail-scroll-container');

    // 模拟：在底部 (1000 - 680 - 300 = 20 <= 24)
    triggerScrollRecheck(scrollContainer, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 680,
    });

    const button = screen.queryByRole('button', { name: '滚动到底部' });
    expect(button).not.toBeInTheDocument();
  });

  it('应该隐藏按钮 当内容不超出容器', () => {
    const chatModel = createChatModelWithHistory(3);
    renderAndFlushInitial(chatModel);

    const scrollContainer = screen.getByTestId('detail-scroll-container');

    // 模拟：内容 200px，容器 300px → 不需要滚动条
    triggerScrollRecheck(scrollContainer, {
      scrollHeight: 200,
      clientHeight: 300,
      scrollTop: 0,
    });

    const button = screen.queryByRole('button', { name: '滚动到底部' });
    expect(button).not.toBeInTheDocument();
  });

  it('应该滚动到底部 当点击按钮', () => {
    const chatModel = createChatModelWithHistory(3);
    renderAndFlushInitial(chatModel);

    const scrollContainer = screen.getByTestId('detail-scroll-container');

    // 先显示按钮
    triggerScrollRecheck(scrollContainer, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });

    const button = screen.getByRole('button', { name: '滚动到底部' });
    expect(button).toBeInTheDocument();

    // 点击按钮
    act(() => {
      fireEvent.click(button);
    });

    // scrollTop 应被设置为 scrollHeight
    expect(scrollContainer.scrollTop).toBe(1000);
  });

  it('应该通过 ResizeObserver 重新检测滚动状态', () => {
    const chatModel = createChatModelWithHistory(3);
    renderAndFlushInitial(chatModel);

    const scrollContainer = screen.getByTestId('detail-scroll-container');

    // 修改滚动尺寸模拟内容增加
    mockScrollDimensions(scrollContainer, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 50,
    });

    // 通过 ResizeObserver 回调触发重新检测
    act(() => {
      resizeCallbacks.forEach((cb) => cb([{ contentRect: { height: 0 } }] as any, null as any));
      vi.advanceTimersByTime(200);
    });

    // 按钮应显示（不在底部）
    const button = screen.getByRole('button', { name: '滚动到底部' });
    expect(button).toBeInTheDocument();
  });
});

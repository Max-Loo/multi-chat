/**
 * 流式渲染性能行为测试
 *
 * 验证 ChatBubble、ThinkingSection 在流式内容更新时的 generateCleanHtml 调用次数，
 * 以及 RunningBubble 在 Redux state 持续更新时的渲染隔离性。
 *
 * 策略：mock generateCleanHtml，通过 vi.fn() spy 追踪调用次数，断言行为契约。
 * RunningBubble 隔离测试通过 generateCleanHtml 调用次数间接验证重渲染行为。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { memo } from 'react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ThinkingSection } from '@/components/chat/ThinkingSection';
import { ChatRoleEnum } from '@/types/chat';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';
import { pushRunningChatHistory } from '@/store/slices/chatSlices';
import RunningBubbleDefault from '@/pages/Chat/components/Panel/Detail/RunningBubble';

// ========================================
// Mock 模块配置
// ========================================

/** mock generateCleanHtml 并导出 spy */
const mockGenerateCleanHtml = vi.fn();

vi.mock('@/utils/markdown', () => ({
  generateCleanHtml: (content: string) => mockGenerateCleanHtml(content),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n());

// ========================================
// 渲染追踪工具
// ========================================

/** 创建包裹 ChatBubble 的追踪 wrapper（memo 阻止 wrapper 自身因 rerender 重复渲染） */
const TrackedChatBubble = memo(function TrackedChatBubble(
  props: Parameters<typeof ChatBubble>[0],
) {
  return <ChatBubble {...props} />;
});

// ========================================
// 常量
// ========================================

const TEST_CHAT_ID = 'test-chat-1';

// ========================================
// 1.2 ChatBubble 流式更新 generateCleanHtml 调用次数测试
// ========================================

describe('ChatBubble 流式更新 generateCleanHtml 调用次数', () => {
  beforeEach(() => {
    mockGenerateCleanHtml.mockClear();
    mockGenerateCleanHtml.mockImplementation((content: string) => `<p>${content}</p>`);
  });

  it('content 逐次增长时每次触发调用', () => {
    const contents = ['H', 'He', 'Hel', 'Hell', 'Hello'];
    const { rerender } = render(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content={contents[0]}
        isRunning={true}
      />,
    );

    for (let i = 1; i < contents.length; i++) {
      rerender(
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content={contents[i]}
          isRunning={true}
        />,
      );
    }

    // 总共 5 次（初始渲染 1 次 + 4 次 rerender）
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(5);
    contents.forEach(content => {
      expect(mockGenerateCleanHtml).toHaveBeenCalledWith(content);
    });
  });

  it('相同 content 的 rerender 不触发额外调用', () => {
    const { rerender } = render(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content="Hello"
        isRunning={true}
      />,
    );

    mockGenerateCleanHtml.mockClear();

    // isRunning 变化，content 不变
    rerender(
      <TrackedChatBubble
        role={ChatRoleEnum.ASSISTANT}
        content="Hello"
        isRunning={false}
      />,
    );

    // ChatBubble 因 isRunning 变化而重渲染，但 useMemo([content]) 的 content 未变，
    // 不会重新调用 generateCleanHtml
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(0);
  });

  it('多个 ChatBubble 独立计算', () => {
    const { rerender } = render(
      <>
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="A"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="B"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="C"
          isRunning={false}
        />
      </>
    );

    // 初始渲染：3 个 ChatBubble 各调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(3);
    mockGenerateCleanHtml.mockClear();

    // 仅更新第 2 个的 content
    rerender(
      <>
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="A"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="B2"
          isRunning={false}
        />
        <TrackedChatBubble
          role={ChatRoleEnum.ASSISTANT}
          content="C"
          isRunning={false}
        />
      </>
    );

    // 仅第 2 个触发额外调用
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    expect(mockGenerateCleanHtml).toHaveBeenCalledWith('B2');
  });
});

// ========================================
// 1.3 ThinkingSection 推理内容更新调用次数测试
// ========================================

describe('ThinkingSection 推理内容更新 generateCleanHtml 调用次数', () => {
  beforeEach(() => {
    mockGenerateCleanHtml.mockClear();
    mockGenerateCleanHtml.mockImplementation((content: string) => `<p>${content}</p>`);
  });

  it('推理内容逐步增长时每次触发调用', () => {
    const contents = ['Step 1', 'Step 1\nStep 2', 'Step 1\nStep 2\nStep 3'];
    const { rerender } = render(
      <ThinkingSection title="思考中" content={contents[0]} loading={true} />,
    );

    for (let i = 1; i < contents.length; i++) {
      rerender(
        <ThinkingSection title="思考中" content={contents[i]} loading={true} />,
      );
    }

    // 总共 3 次（每次 content 变化触发 useMemo 重计算）
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(3);
    contents.forEach(content => {
      expect(mockGenerateCleanHtml).toHaveBeenCalledWith(content);
    });
  });

  it('content 不变时 title 或 loading 变化不触发调用', () => {
    const { rerender } = render(
      <ThinkingSection title="思考中" content="推理完成" loading={true} />,
    );

    // 初始渲染调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    mockGenerateCleanHtml.mockClear();

    // title 变化，content 不变
    rerender(
      <ThinkingSection title="思考完毕" content="推理完成" loading={true} />,
    );

    // loading 变化，content 不变
    rerender(
      <ThinkingSection title="思考完毕" content="推理完成" loading={false} />,
    );

    // generateCleanHtml 不应被再次调用（useMemo 依赖未变）
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(0);
  });
});

// ========================================
// 1.4 RunningBubble 渲染隔离测试
//
// 通过 mockGenerateCleanHtml 调用次数间接验证 RunningBubble 的重渲染行为：
// - RunningBubble 内部渲染 ChatBubble（有内容时）
// - ChatBubble 的 useMemo([content]) 调用 generateCleanHtml
// - 若 RunningBubble 不重渲染，ChatBubble 也不重渲染，generateCleanHtml 不会再次被调用
// ========================================

describe('RunningBubble 渲染隔离', () => {
  beforeEach(() => {
    mockGenerateCleanHtml.mockClear();
    mockGenerateCleanHtml.mockImplementation((content: string) => `<p>${content}</p>`);
  });

  it('当前面板流式更新时渲染', () => {
    const chatModel = createMockPanelChatModel('model-1');

    const store = createTypeSafeTestStore({
      chat: createChatSliceState({
        chatList: [{ id: TEST_CHAT_ID, chatModelList: [chatModel] }],
        selectedChatId: TEST_CHAT_ID,
        runningChat: {
          [TEST_CHAT_ID]: {
            [chatModel.modelId]: {
              isSending: true,
              history: createMockPanelMessage({
                role: ChatRoleEnum.ASSISTANT,
                content: 'H',
              }),
            },
          },
        },
      }),
    });

    renderWithProviders(
      <RunningBubbleDefault chatModel={chatModel} />,
      { store },
    );

    // 初始渲染：generateCleanHtml 调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    mockGenerateCleanHtml.mockClear();

    // dispatch 更新 content 为 "He"
    act(() => {
      store.dispatch(pushRunningChatHistory({
        chat: { id: TEST_CHAT_ID, chatModelList: [chatModel] },
        model: { id: chatModel.modelId } as any,
        message: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'He',
        }),
      }));
    });

    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    expect(mockGenerateCleanHtml).toHaveBeenCalledWith('He');
    mockGenerateCleanHtml.mockClear();

    // dispatch 更新 content 为 "Hel"
    act(() => {
      store.dispatch(pushRunningChatHistory({
        chat: { id: TEST_CHAT_ID, chatModelList: [chatModel] },
        model: { id: chatModel.modelId } as any,
        message: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Hel',
        }),
      }));
    });

    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    expect(mockGenerateCleanHtml).toHaveBeenCalledWith('Hel');
  });

  it('其他面板的 runningChat 更新时不渲染', () => {
    const chatModel = createMockPanelChatModel('model-1');
    const otherChatId = 'other-chat-1';

    const store = createTypeSafeTestStore({
      chat: createChatSliceState({
        chatList: [
          { id: TEST_CHAT_ID, chatModelList: [chatModel] },
          { id: otherChatId, chatModelList: [chatModel] },
        ],
        selectedChatId: TEST_CHAT_ID,
        runningChat: {
          [TEST_CHAT_ID]: {
            [chatModel.modelId]: {
              isSending: true,
              history: createMockPanelMessage({
                role: ChatRoleEnum.ASSISTANT,
                content: 'H',
              }),
            },
          },
          [otherChatId]: {
            [chatModel.modelId]: {
              isSending: true,
              history: createMockPanelMessage({
                role: ChatRoleEnum.ASSISTANT,
                content: 'Other',
              }),
            },
          },
        },
      }),
    });

    renderWithProviders(
      <RunningBubbleDefault chatModel={chatModel} />,
      { store },
    );

    // 初始渲染：generateCleanHtml 调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    mockGenerateCleanHtml.mockClear();

    // 更新另一个 chatId 的 runningChat
    act(() => {
      store.dispatch(pushRunningChatHistory({
        chat: { id: otherChatId, chatModelList: [chatModel] },
        model: { id: chatModel.modelId } as any,
        message: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Other2',
        }),
      }));
    });

    // 不应因其他面板数据变化而重渲染，generateCleanHtml 未被再次调用
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(0);
  });

  it('其他模型的 runningChat 更新时不渲染', () => {
    const chatModel1 = createMockPanelChatModel('model-1');
    const chatModel2 = createMockPanelChatModel('model-2');

    const store = createTypeSafeTestStore({
      chat: createChatSliceState({
        chatList: [{
          id: TEST_CHAT_ID,
          chatModelList: [chatModel1, chatModel2],
        }],
        selectedChatId: TEST_CHAT_ID,
        runningChat: {
          [TEST_CHAT_ID]: {
            [chatModel1.modelId]: {
              isSending: true,
              history: createMockPanelMessage({
                role: ChatRoleEnum.ASSISTANT,
                content: 'Model1 content',
              }),
            },
            [chatModel2.modelId]: {
              isSending: true,
              history: createMockPanelMessage({
                role: ChatRoleEnum.ASSISTANT,
                content: 'Model2 content',
              }),
            },
          },
        },
      }),
    });

    renderWithProviders(
      <RunningBubbleDefault chatModel={chatModel1} />,
      { store },
    );

    // 初始渲染：generateCleanHtml 调用 1 次
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(1);
    mockGenerateCleanHtml.mockClear();

    // 更新另一个 modelId 的 runningChat
    act(() => {
      store.dispatch(pushRunningChatHistory({
        chat: { id: TEST_CHAT_ID, chatModelList: [chatModel1, chatModel2] },
        model: { id: chatModel2.modelId } as any,
        message: createMockPanelMessage({
          role: ChatRoleEnum.ASSISTANT,
          content: 'Model2 updated',
        }),
      }));
    });

    // 不应因其他模型数据变化而重渲染，generateCleanHtml 未被再次调用
    expect(mockGenerateCleanHtml).toHaveBeenCalledTimes(0);
  });
});

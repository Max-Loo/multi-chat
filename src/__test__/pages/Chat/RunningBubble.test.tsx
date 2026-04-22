/**
 * RunningBubble 组件单元测试
 *
 * 测试目标：验证 RunningBubble 根据运行状态决定渲染内容
 *
 * 技术方案：
 * - 使用 renderWithProviders + 真实 Redux store 渲染完整组件树
 * - 通过 Redux store 的 preloadedState 控制组件行为
 * - Mock 系统边界（useTranslation、generateCleanHtml）
 */

import { screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RunningBubble from '@/pages/Chat/components/Panel/Detail/RunningBubble';
import { renderWithProviders } from '@/__test__/helpers/render/redux';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';
import { ChatRoleEnum, type StandardMessage, type Chat, type ChatModel } from '@/types/chat';

// ========================================
// Mock 模块配置
// ========================================

/**
 * Mock generateCleanHtml
 * RunningBubble 通过 ChatBubble 间接使用此函数
 */
vi.mock('@/utils/markdown', () => ({
  generateCleanHtml: vi.fn((content: string) => `<p>${content}</p>`),
}));

vi.mock('react-i18next', () =>
  globalThis.__createI18nMockReturn({
    chat: { thinking: '思考中...', thinkingComplete: '思考完成' },
    common: { loading: '加载中' },
  }),
);

// ========================================
// 测试常量和辅助函数
// ========================================

const CHAT_ID = 'chat-running-test-1';
const MODEL_ID = 'model-running-test-1';

/** 创建默认的 preloadedState */
function createPreloadedState(runningChatData?: {
  isSending: boolean;
  history: StandardMessage | null;
  errorMessage?: string;
}) {
  const chatModel: ChatModel = createMockPanelChatModel(MODEL_ID);
  const chat: Chat = {
    id: CHAT_ID,
    chatModelList: [chatModel],
  };

  return {
    chat: {
      chatMetaList: [{
        id: CHAT_ID,
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
      runningChat: runningChatData
        ? {
            [CHAT_ID]: {
              [MODEL_ID]: runningChatData,
            },
          }
        : {} as Record<string, Record<string, { isSending: boolean; history: StandardMessage | null; errorMessage?: string }>>,
    },
    models: {
      models: [],
      loading: false,
      error: null,
      initializationError: null,
    },
  };
}

/** 渲染 RunningBubble 组件的辅助函数 */
function renderRunningBubble(runningChatData?: Parameters<typeof createPreloadedState>[0]) {
  const chatModel = createMockPanelChatModel(MODEL_ID);
  return renderWithProviders(<RunningBubble chatModel={chatModel} />, {
    preloadedState: createPreloadedState(runningChatData),
  });
}

// ========================================
// 测试用例
// ========================================

describe('RunningBubble Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('应该返回 null 当没有运行数据', () => {
    renderRunningBubble();

    // RunningBubble 返回 null，不应有 ChatBubble 或 Spinner
    expect(screen.queryByTestId('assistant-message')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('应该返回 null 当 isSending 为 false', () => {
    renderRunningBubble({
      isSending: false,
      history: null,
    });

    expect(screen.queryByTestId('assistant-message')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('应该显示 Spinner 当流式刚开始且无内容', () => {
    renderRunningBubble({
      isSending: true,
      history: null,
    });

    // Spinner 组件使用 role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('assistant-message')).not.toBeInTheDocument();
  });

  it('应该显示 ChatBubble 当有流式内容', () => {
    renderRunningBubble({
      isSending: true,
      history: createMockPanelMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Streaming response',
        reasoningContent: 'Some reasoning',
      }),
    });

    // 应渲染 ChatBubble，包含流式内容
    expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    expect(screen.getByText('Streaming response')).toBeInTheDocument();
  });
});

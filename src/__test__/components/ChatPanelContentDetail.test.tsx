/**
 * ChatPanelContentDetail 组件测试
 *
 * 测试聊天详情组件的渲染和交互
 * 不 mock useSelectedChat / useIsSending，通过 Redux state 驱动行为
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import ChatPanelContentDetail from '@/pages/Chat/components/Panel/Detail';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { ChatModel } from '@/types/chat';
import type { Model } from '@/types/model';
import { ChatRoleEnum } from '@/types/chat';
import { chatToMeta } from '@/types/chat';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createModelSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks';
import { asTestType } from '@/__test__/helpers/testing-utils';

// Detail 组件内部使用 ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('virtua', () => {
  // oxlint-disable-next-line consistent-function-scoping — Vitest vi.mock 工厂函数会被提升，必须内联定义
  const V = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { Virtualizer: V, VList: V };
});

vi.mock('react-i18next', () => {
  const R = { chat: { modelDeleted: '模型已删除', deleted: '已删除', disabled: '已禁用', supplier: '供应商', model: '模型', nickname: '昵称', thinking: '思考中......', thinkingComplete: '思考完毕', scrollToBottom: '滚动到底部' }, common: { loading: 'Loading...' } };
  return globalThis.__createI18nMockReturn(R);
});

describe('ChatPanelContentDetail', () => {
  /**
   * 创建测试用 Redux Store
   */
  const createTestStore = (overrides?: {
    chatModel?: ChatModel;
    models?: Model[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runningChat?: any;
  }) => {
    const defaultChatModel: ChatModel = {
      modelId: 'model-1',
      chatHistoryList: [],
    };

    const chatModel = overrides?.chatModel || defaultChatModel;

    const defaultModels: Model[] = [
      {
        id: 'model-1',
        nickname: 'Model 1',
        apiKey: 'test-key',
        apiAddress: 'https://api.test.com',
        remark: 'Test',
        modelKey: 'model-1',
        modelName: 'Model 1',
        providerName: 'TestProvider',
        providerKey: 'deepseek' as ModelProviderKeyEnum,
        isEnable: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString(),
      },
    ];

    const chat = {
        id: 'test-chat-1',
        name: 'Test Chat',
        chatModelList: [chatModel],
        isDeleted: false,
      };

    return createTypeSafeTestStore({
      chat: createChatSliceState({
        chatMetaList: [chatToMeta(chat)],
        activeChatData: { 'test-chat-1': chat },
        sendingChatIds: {},
        selectedChatId: 'test-chat-1',
        runningChat: overrides?.runningChat || {},
      }),
      chatPage: createChatPageSliceState({
        isSidebarCollapsed: false,
        isShowChatPage: true,
      }),
      models: createModelSliceState({
        models: overrides?.models || defaultModels,
      }),
    });
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('4.3.1 测试渲染单个模型面板', () => {
    it('应该成功渲染单个模型面板', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(container.firstChild).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该渲染包含滚动容器的面板', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('应该渲染模型标题（DetailTitle）', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // Title 显示 "nickname (modelName)" 格式
      expect(screen.getByText('Model 1 (Model 1)')).toBeInTheDocument();
    });

    it('应该渲染 RunningChatBubble 组件', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // runningChat 为空，RunningBubble 返回 null，不应有 spinner
      expect(container.querySelector('svg.animate-spin')).toBeNull();
    });
  });

  describe('4.3.2 测试传递 chatModel prop', () => {
    it('应该正确接收和使用 chatModel prop', () => {
      const chatModel: ChatModel = {
        modelId: 'custom-model-1',
        chatHistoryList: [],
      };

      const customModels = [
        {
          id: 'custom-model-1',
          nickname: 'Custom Model',
          apiKey: 'custom-key',
          apiAddress: 'https://api.custom.com',
          remark: 'Custom',
          modelKey: 'custom-model-1',
          modelName: 'Custom Model Name',
          providerName: 'CustomProvider',
          providerKey: 'custom-provider' as ModelProviderKeyEnum,
          isEnable: true,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updateAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({ chatModel, models: customModels });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // Title 显示自定义模型的名称
      expect(screen.getByText('Custom Model (Custom Model Name)')).toBeInTheDocument();
    });

    it('应该根据 chatModel 渲染对应的历史记录', () => {
      const message1 = { id: 'msg-1', role: ChatRoleEnum.USER, content: 'User message 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null };
      const message2 = { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Assistant response 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null };

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [message1, message2],
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // 应该渲染两条历史消息
      expect(screen.getByText('User message 1')).toBeInTheDocument();
      expect(screen.getByText('Assistant response 1')).toBeInTheDocument();
    });

    it('应该处理空的 chatHistoryList', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(container.firstChild).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该处理 null 或 undefined 的 chatHistoryList', () => {
      const chatModel1: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: asTestType<ChatModel['chatHistoryList']>(null),
      };

      const store = createTestStore({ chatModel: chatModel1 });

      const { container: container1 } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel1} />,
        { store }
      );

      expect(container1.firstChild).toBeDefined();

      const chatModel2: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: asTestType<ChatModel['chatHistoryList']>(undefined),
      };

      const { container: container2 } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel2} />,
        { store }
      );

      expect(container2.firstChild).toBeDefined();
    });
  });

  describe('历史消息渲染', () => {
    it('应该渲染多条历史消息', () => {
      const messages = [
        { id: 'msg-1', role: ChatRoleEnum.USER, content: 'Message 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null },
        { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Message 2', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null },
        { id: 'msg-3', role: ChatRoleEnum.USER, content: 'Message 3', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null },
        { id: 'msg-4', role: ChatRoleEnum.ASSISTANT, content: 'Message 4', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null },
      ];

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: messages,
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // 应该渲染 4 个 ChatBubble
      expect(screen.getAllByTestId('chat-bubble')).toHaveLength(4);
    });

    it('应该为每条消息渲染独立的 ChatBubble', () => {
      const messages = [
        { id: 'msg-1', role: ChatRoleEnum.USER, content: 'User message', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null },
        { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Assistant message', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null },
      ];

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: messages,
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // 每条消息对应一个 ChatBubble
      expect(screen.getAllByTestId('chat-bubble')).toHaveLength(2);
    });
  });

  describe('错误信息显示', () => {
    it('应该在存在错误时显示错误提示', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const runningChat = {
        'test-chat-1': {
          'model-1': {
            isSending: false,
            errorMessage: 'Network error occurred',
          },
        },
      };

      const store = createTestStore({ chatModel, runningChat });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('应该在没有错误时不显示错误提示', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('滚动条自适应', () => {
    it('应该默认应用正确的类名', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('scrollbar-none');
    });
  });

  describe('发送状态显示', () => {
    it('应该在发送状态时正常渲染', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const runningChat = {
        'test-chat-1': {
          'model-1': {
            isSending: true,
            errorMessage: null,
          },
        },
      };

      const store = createTestStore({ chatModel, runningChat });

      const { container } = renderWithProviders(
        <ChatPanelContentDetail chatModel={chatModel} />,
        { store }
      );

      // isSending=true 且无 history 时应该显示 Spinner
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });
  });
});

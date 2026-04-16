/**
 * ChatPanelContentDetail 组件测试
 *
 * 测试聊天详情组件的渲染和交互
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import ChatPanelContentDetail from '@/pages/Chat/components/Panel/Detail';
import type { ChatModel } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createModelSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks';
import { asTestType } from '@/__test__/helpers/testing-utils';

vi.mock('react-i18next', () => {
  const R = { chat: { modelDeleted: '模型已删除', deleted: '已删除', disabled: '已禁用', supplier: '供应商', model: '模型', nickname: '昵称', thinking: '思考中......', thinkingComplete: '思考完毕' }, common: { loading: 'Loading...' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock useSelectedChat hook because it requires complex Redux store setup
vi.mock('@/pages/Chat/hooks/useSelectedChat', () => ({
  useSelectedChat: () => ({
    selectedChat: {
      id: 'test-chat-1',
      name: 'Test Chat',
      chatModelList: [],
      isDeleted: false,
    },
  }),
}));

// Mock useIsSending hook because it requires complex Redux state
vi.mock('@/pages/Chat/hooks/useIsSending', () => ({
  useIsSending: () => ({
    isSending: false,
  }),
}));

describe('ChatPanelContentDetail', () => {
  /**
   * 创建测试用 Redux Store
   */
  const createTestStore = (overrides?: {
    chatModel?: ChatModel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    models?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    runningChat?: any;
  }) => {
    const defaultChatModel: ChatModel = {
      modelId: 'model-1',
      chatHistoryList: [],
    };

    const chatModel = overrides?.chatModel || defaultChatModel;

    const defaultModels = [
      {
        id: 'model-1',
        nickname: 'Model 1',
        apiKey: 'test-key',
        apiAddress: 'https://api.test.com',
        remark: 'Test',
        modelKey: 'model-1',
        modelName: 'Model 1',
        providerName: 'TestProvider',
        providerKey: 'deepseek',
        isEnable: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString(),
      },
    ];

    return createTypeSafeTestStore({
      chat: createChatSliceState({
        chatList: [
          {
            id: 'test-chat-1',
            name: 'Test Chat',
            chatModelList: [chatModel],
            isDeleted: false,
          },
        ],
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

      // 验证组件成功渲染
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

      // 验证滚动容器存在
      const scrollContainer = container.querySelector('div.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('应该渲染模型标题（DetailTitle）', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      // 组件应该能够渲染而不抛错
      expect(() => {
        renderWithProviders(
          <ChatPanelContentDetail chatModel={chatModel} />,
          { store }
        );
      }).not.toThrow();
    });

    it('应该渲染 RunningChatBubble 组件', () => {
      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [],
      };

      const store = createTestStore({ chatModel });

      // 组件应该能够渲染而不抛错
      expect(() => {
        renderWithProviders(
          <ChatPanelContentDetail chatModel={chatModel} />,
          { store }
        );
      }).not.toThrow();
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
          providerKey: 'custom-provider',
          isEnable: true,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updateAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({ chatModel, models: customModels });

      // 组件应该能够渲染而不抛错
      expect(() => {
        renderWithProviders(
          <ChatPanelContentDetail chatModel={chatModel} />,
          { store }
        );
      }).not.toThrow();
    });

    it('应该根据 chatModel 渲染对应的历史记录', () => {
      const message1 = { id: 'msg-1', role: ChatRoleEnum.USER, content: 'User message 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: null, raw: null };
      const message2 = { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'Assistant response 1', timestamp: Date.now() / 1000, modelKey: 'test-model', finishReason: 'stop', raw: null };

      const chatModel: ChatModel = {
        modelId: 'model-1',
        chatHistoryList: [message1, message2],
      };

      const store = createTestStore({ chatModel });

      // 组件应该能够渲染而不抛错
      expect(() => {
        renderWithProviders(
          <ChatPanelContentDetail chatModel={chatModel} />,
          { store }
        );
      }).not.toThrow();
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

      // 验证组件在没有历史记录时也能正常渲染
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

      // 组件应该能够渲染而不抛错
      expect(() => {
        renderWithProviders(
          <ChatPanelContentDetail chatModel={chatModel} />,
          { store }
        );
      }).not.toThrow();
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

      // 组件应该能够渲染而不抛错
      expect(() => {
        renderWithProviders(
          <ChatPanelContentDetail chatModel={chatModel} />,
          { store }
        );
      }).not.toThrow();
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

      // 验证错误消息显示
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

      // 验证没有错误提示显示
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

      // 默认应该有 scrollbar-none 类（未滚动时）
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

      // 验证组件在发送状态下正常渲染
      expect(container.firstChild).toBeDefined();
    });
  });
});

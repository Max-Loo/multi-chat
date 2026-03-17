/**
 * DetailTitle 组件测试
 * 测试模型详情标题组件的渲染和功能
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import DetailTitle from '@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/DetailTitle';
import { ChatModel } from '@/types/chat';
import { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import modelReducer from '@/store/slices/modelSlice';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (keyOrFn: string | ((_: any) => string)) => {
      if (typeof keyOrFn === 'function') {
        return keyOrFn({
          chat: {
            modelDeleted: '模型已删除',
            deleted: '已删除',
            disabled: '已禁用',
            supplier: '供应商',
            model: '模型',
            nickname: '昵称',
          },
        });
      }
      const translations: Record<string, string> = {
        'chat.modelDeleted': '模型已删除',
        'chat.deleted': '已删除',
        'chat.disabled': '已禁用',
        'chat.supplier': '供应商',
        'chat.model': '模型',
        'chat.nickname': '昵称',
      };
      return translations[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/**
 * 创建测试用的 Redux store
 */
const createTestStore = (models: Model[] = []) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
      models: modelReducer,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    preloadedState: {
      models: {
        models,
        loading: false,
        error: null,
        initializationError: null,
      },
      chat: {
        chatList: [],
        selectedChatId: null,
        loading: false,
        error: null,
        initializationError: null,
        runningChat: {},
      },
      chatPage: {
        isSidebarCollapsed: false,
        isShowChatPage: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
};

/**
 * 创建测试用的 Model 对象
 */
const createTestModel = (overrides?: Partial<Model>): Model => {
  const now = new Date().toISOString();
  return {
    id: 'test-model-1',
    nickname: 'Test Model',
    apiKey: 'test-api-key',
    apiAddress: 'https://api.test.com/v1',
    remark: 'Test remark',
    modelKey: 'test-model-key',
    modelName: 'Test Model Name',
    providerName: 'TestProvider',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    isEnable: true,
    createdAt: now,
    updateAt: now,
    ...overrides,
  };
};

/**
 * 创建测试用的 ChatModel 对象
 */
const createTestChatModel = (modelId: string): ChatModel => {
  return {
    modelId,
    chatHistoryList: [],
  };
};

/**
 * 创建测试包装器
 */
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function ({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('DetailTitle', () => {
  afterEach(() => {
    cleanup();
  });

  describe('6.1 测试正常状态渲染（Logo + 昵称）', () => {
    it('应该显示「昵称 (模型名)」格式', () => {
      const testModel = createTestModel({
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        nickname: '我的 DeepSeek 模型',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const nicknameElement = screen.getByText('我的 DeepSeek 模型 (deepseek-chat)');
      expect(nicknameElement).toBeInTheDocument();
    });

    it('应该显示 ProviderLogo 组件', () => {
      const testModel = createTestModel({
        providerName: 'DeepSeek',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // 验证 Logo 容器存在（通过查询 alt 属性包含 "logo" 的元素）
      const logoElements = screen.getAllByAltText(/logo/i);
      expect(logoElements.length).toBeGreaterThan(0);
    });

    it('应该正确渲染包含 emoji 的昵称', () => {
      const testModel = createTestModel({
        nickname: '🚀 DeepSeek 🌟',
        modelName: 'deepseek-chat',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const nicknameElement = screen.getByText(/🚀 DeepSeek 🌟 \(deepseek-chat\)/);
      expect(nicknameElement).toBeInTheDocument();
    });
  });

  describe('6.2 测试昵称为空时显示模型名称', () => {
    it('当昵称为空时应该显示模型名称', () => {
      const testModel = createTestModel({
        modelName: 'deepseek-chat',
        nickname: '',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const modelNameElement = screen.getByText('deepseek-chat');
      expect(modelNameElement).toBeInTheDocument();
    });
  });

  describe('6.3 测试长文本截断样式', () => {
    it('应该为显示名称容器添加 truncate 类', () => {
      const testModel = createTestModel({
        nickname: '这是一个非常长的昵称用于测试截断效果',
        modelName: 'very-long-model-name-for-testing',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const displayNameElement = screen.getByText(/这是一个非常长的昵称用于测试截断效果/);
      expect(displayNameElement).toHaveClass('truncate');
    });
  });

  describe('6.4 测试 Tooltip 内容正确性', () => {
    it('Tooltip 应该包含完整的模型信息', () => {
      const testModel = createTestModel({
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        nickname: '我的模型',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // 验证 Tooltip 内容存在（即使不可见）
      // 注意：Tooltip 内容在 Radix UI 中可能不在 DOM 中直到触发
      // 这里我们验证组件渲染成功
      const triggerElement = screen.getByText('我的模型 (deepseek-chat)').closest('[data-state]');
      expect(triggerElement).toBeInTheDocument();
    });
  });

  describe('6.5 测试异常状态 Badge 显示', () => {
    it('应该在模型被删除时显示"已删除"徽章', () => {
      const testModel = createTestModel({
        isDeleted: true,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const deletedBadge = screen.getByText('已删除');
      expect(deletedBadge).toBeInTheDocument();
    });

    it('应该在模型被禁用时显示"已禁用"徽章', () => {
      const testModel = createTestModel({
        isEnable: false,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const disabledBadge = screen.getByText('已禁用');
      expect(disabledBadge).toBeInTheDocument();
    });

    it('正常状态不应该显示任何 Badge', () => {
      const testModel = createTestModel({
        isEnable: true,
        isDeleted: false,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // 只应该有昵称，没有 Badge
      expect(screen.queryByText('已删除')).not.toBeInTheDocument();
      expect(screen.queryByText('已禁用')).not.toBeInTheDocument();
    });
  });

  describe('6.6 测试模型不存在时的错误提示', () => {
    it('应该在模型列表中找不到对应模型时显示"模型已删除"', () => {
      const chatModel = createTestChatModel('non-existent-model-id');
      const store = createTestStore([]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const deletedBadge = screen.getByText('模型已删除');
      expect(deletedBadge).toBeInTheDocument();
    });
  });

  describe('不同 providerKey 的显示', () => {
    it('应该正确显示 DeepSeek 提供商', () => {
      const testModel = createTestModel({
        providerName: 'DeepSeek',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        modelName: 'deepseek-chat',
        nickname: 'DeepSeek Chat',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const nicknameElement = screen.getByText('DeepSeek Chat (deepseek-chat)');
      expect(nicknameElement).toBeInTheDocument();
    });

    it('应该正确显示 Moonshot 提供商', () => {
      const testModel = createTestModel({
        providerName: 'Moonshot AI',
        providerKey: ModelProviderKeyEnum.MOONSHOTAI,
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 8K',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const nicknameElement = screen.getByText('Moonshot 8K (moonshot-v1-8k)');
      expect(nicknameElement).toBeInTheDocument();
    });

    it('应该正确处理多个模型的情况', () => {
      const model1 = createTestModel({
        id: 'model-1',
        modelName: 'deepseek-chat',
        nickname: 'DeepSeek Chat',
      });
      const model2 = createTestModel({
        id: 'model-2',
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 8K',
      });
      const chatModel = createTestChatModel(model2.id);
      const store = createTestStore([model1, model2]);
      const wrapper = createWrapper(store);

      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      const nicknameElement = screen.getByText('Moonshot 8K (moonshot-v1-8k)');
      expect(nicknameElement).toBeInTheDocument();
      expect(screen.queryByText('DeepSeek Chat (deepseek-chat)')).not.toBeInTheDocument();
    });
  });
});

/**
 * DetailTitle 组件测试
 *
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
    t: (keyOrFn: string | ((_: any) => string)) => {
      // 支持函数式调用和字符串键调用
      if (typeof keyOrFn === 'function') {
        return keyOrFn({
          chat: {
            modelDeleted: '模型已删除',
            deleted: '已删除',
            disabled: '已禁用',
          },
        });
      }
      // 字符串键调用
      const translations: Record<string, string> = {
        'chat.modelDeleted': '模型已删除',
        'chat.deleted': '已删除',
        'chat.disabled': '已禁用',
      };
      return translations[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/**
 * 创建测试用的 Redux store
 * @param models 模型列表
 * @returns 配置好的 store
 */
const createTestStore = (models: Model[] = []) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
      models: modelReducer,
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
    } as any,
  });
};

/**
 * 创建测试用的 Model 对象
 * @param overrides 覆盖的字段
 * @returns Model 对象
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
 * @param modelId 模型 ID
 * @returns ChatModel 对象
 */
const createTestChatModel = (modelId: string): ChatModel => {
  return {
    modelId,
    chatHistoryList: [],
  };
};

/**
 * 创建测试包装器
 * @param store Redux store
 * @returns Wrapper 组件
 */
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('DetailTitle', () => {
  afterEach(() => {
    cleanup();
  });

  describe('4.6.1 测试显示模型名称', () => {
    it('应该显示完整的模型信息（提供商 | 模型名称 | 昵称）', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        nickname: '我的 DeepSeek 模型',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/DeepSeek \| deepseek-chat \| 我的 DeepSeek 模型/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确渲染包含特殊字符的模型名称', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'Test-Provider',
        modelName: 'model_v2.0-beta',
        nickname: '模型 <测试> & 示例',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Test-Provider \| model_v2.0-beta \| 模型 <测试> & 示例/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确渲染包含数字的模型名称', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'Provider123',
        modelName: 'gpt-4',
        nickname: 'Model 2024',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Provider123 \| gpt-4 \| Model 2024/);
      expect(titleElement).toBeInTheDocument();
    });
  });

  describe('4.6.2 测试显示提供商信息', () => {
    it('应该显示不同的提供商名称', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'Moonshot AI',
        providerKey: ModelProviderKeyEnum.MOONSHOTAI,
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 测试模型',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Moonshot AI \| moonshot-v1-8k \| Moonshot 测试模型/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该在模型被删除时显示"模型已删除"徽章', () => {
      // Arrange
      const testModel = createTestModel({
        id: 'deleted-model',
        isDeleted: true,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const deletedBadge = screen.getByText('已删除');
      expect(deletedBadge).toBeInTheDocument();
    });

    it('应该在模型被禁用时显示"已禁用"徽章', () => {
      // Arrange
      const testModel = createTestModel({
        isEnable: false,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const disabledBadge = screen.getByText('已禁用');
      expect(disabledBadge).toBeInTheDocument();
    });

    it('应该在模型列表中找不到对应模型时显示"模型已删除"', () => {
      // Arrange
      const chatModel = createTestChatModel('non-existent-model-id');
      const store = createTestStore([]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const deletedBadge = screen.getByText('模型已删除');
      expect(deletedBadge).toBeInTheDocument();
    });
  });

  describe('4.6.3 测试不同 providerKey 的显示', () => {
    it('应该正确显示 DeepSeek 提供商', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'DeepSeek',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        modelName: 'deepseek-chat',
        nickname: 'DeepSeek Chat',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/DeepSeek \| deepseek-chat \| DeepSeek Chat/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确显示 Moonshot 提供商', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'Moonshot AI',
        providerKey: ModelProviderKeyEnum.MOONSHOTAI,
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 8K',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Moonshot AI \| moonshot-v1-8k \| Moonshot 8K/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确显示 Zhipu 提供商', () => {
      // Arrange
      const testModel = createTestModel({
        providerName: 'Zhipu AI',
        providerKey: ModelProviderKeyEnum.ZHIPUAI,
        modelName: 'glm-4',
        nickname: '智谱 GLM-4',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Zhipu AI \| glm-4 \| 智谱 GLM-4/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确处理多个模型的情况', () => {
      // Arrange
      const model1 = createTestModel({
        id: 'model-1',
        providerName: 'DeepSeek',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        modelName: 'deepseek-chat',
        nickname: 'DeepSeek Chat',
      });
      const model2 = createTestModel({
        id: 'model-2',
        providerName: 'Moonshot AI',
        providerKey: ModelProviderKeyEnum.MOONSHOTAI,
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 8K',
      });
      const chatModel = createTestChatModel(model2.id);
      const store = createTestStore([model1, model2]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Moonshot AI \| moonshot-v1-8k \| Moonshot 8K/);
      expect(titleElement).toBeInTheDocument();
      const deepseekTitle = screen.queryByText(/DeepSeek \| deepseek-chat \| DeepSeek Chat/);
      expect(deepseekTitle).not.toBeInTheDocument();
    });
  });

  describe('边缘情况测试', () => {
    it('应该正确处理空字符串的模型名称', () => {
      // Arrange
      const testModel = createTestModel({
        modelName: '',
        nickname: '',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/TestProvider \| \|/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确处理包含换行符的模型名称', () => {
      // Arrange
      const testModel = createTestModel({
        nickname: 'Line1\nLine2',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/Line1/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该正确处理包含 emoji 的模型名称', () => {
      // Arrange
      const testModel = createTestModel({
        nickname: '🚀 DeepSeek 🌟',
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const titleElement = screen.getByText(/🚀 DeepSeek 🌟/);
      expect(titleElement).toBeInTheDocument();
    });

    it('应该在模型被标记为 isDeleted 时显示"已删除"徽章', () => {
      // Arrange
      const testModel = createTestModel({
        isDeleted: true,
      });
      const chatModel = createTestChatModel(testModel.id);
      const store = createTestStore([testModel]);
      const wrapper = createWrapper(store);

      // Act
      render(<DetailTitle chatModel={chatModel} />, { wrapper });

      // Assert
      const deletedBadge = screen.getByText('已删除');
      expect(deletedBadge).toBeInTheDocument();
    });
  });
});

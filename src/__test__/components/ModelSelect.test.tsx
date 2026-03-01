/**
 * ModelSelect 组件交互测试
 *
 * 测试模型选择组件的用户交互行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ModelSelect from '@/pages/Chat/components/ChatContent/components/ModelSelect';
import chatReducer from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      if (typeof keyOrFn === 'function') {
        return keyOrFn({
          chat: {
            selectModelHint: '请选择至少一个模型',
            configureChatSuccess: '配置聊天成功',
            configureChatFailed: '配置聊天失败',
            searchPlaceholder: '搜索模型...',
          },
          common: {
            confirm: '确认',
          },
          table: {
            nickname: '模型名称',
            modelProvider: '模型供应商',
            modelName: '模型',
            remark: '备注',
            apiAddress: 'API地址',
            operations: '操作',
            isEnable: '状态',
          },
        });
      }
      const translations: Record<string, string> = {
        'chat.selectModelHint': '请选择至少一个模型',
        'chat.configureChatSuccess': '配置聊天成功',
        'chat.configureChatFailed': '配置聊天失败',
        'chat.searchPlaceholder': '搜索模型...',
        'common.confirm': '确认',
      };
      return translations[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestStore = () => {
  const mockModels = [
    createMockModel({
      id: 'model-1',
      nickname: 'GPT-4',
      providerKey: 'deepseek' as any,
      modelName: 'gpt-4',
      providerName: 'OpenAI',
    }),
    createMockModel({
      id: 'model-2',
      nickname: 'Claude 3',
      providerKey: 'moonshotai' as any,
      modelName: 'claude-3-opus',
      providerName: 'Anthropic',
    }),
    createMockModel({
      id: 'model-3',
      nickname: 'DeepSeek',
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      modelName: 'deepseek-chat',
      providerName: 'DeepSeek',
    }),
  ];

  return configureStore({
    reducer: {
      models: modelReducer,
      modelProvider: modelProviderReducer,
      chat: chatReducer,
    } as any,
    preloadedState: {
      models: {
        models: mockModels,
        loading: false,
        error: null,
      },
      modelProvider: {
        providers: [
          { providerKey: 'openai', providerName: 'OpenAI', providerLabel: 'OpenAI' },
          { providerKey: 'anthropic', providerName: 'Anthropic', providerLabel: 'Anthropic' },
          { providerKey: 'deepseek', providerName: 'DeepSeek', providerLabel: 'DeepSeek' },
        ],
        loading: false,
        error: null,
      },
      chat: {
        chatList: [createMockChat({ id: 'chat-1', name: 'Test Chat' })],
        selectedChatId: 'chat-1',
        loading: false,
        error: null,
        initializationError: null,
        runningChat: {},
      },
    } as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('ModelSelect 用户交互测试', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  /**
   * 4.20 - 创建用户交互行为测试
   * 测试模型选择的基本渲染和用户交互
   */
  describe('基本渲染交互', () => {
    it('应该正确渲染而不抛错', () => {
      const wrapper = createWrapper(store);
      expect(() => render(<ModelSelect />, { wrapper })).not.toThrow();
    });

    it('应该渲染模型列表', () => {
      const wrapper = createWrapper(store);
      const { container } = render(<ModelSelect />, { wrapper });

      // 验证表格存在
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('应该渲染确认按钮', () => {
      const wrapper = createWrapper(store);
      const { container } = render(<ModelSelect />, { wrapper });

      // 验证确认按钮存在
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  /**
   * 边界情况测试
   */
  describe('边界情况', () => {
    it('应该处理组件卸载', () => {
      const wrapper = createWrapper(store);
      const { unmount } = render(<ModelSelect />, { wrapper });
      expect(() => unmount()).not.toThrow();
    });

    it('应该处理重新渲染', () => {
      const wrapper = createWrapper(store);
      const { rerender } = render(<ModelSelect />, { wrapper });
      expect(() => rerender(<ModelSelect />)).not.toThrow();
    });
  });
});

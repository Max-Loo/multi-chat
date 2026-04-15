/**
 * ModelSelect 组件交互测试
 *
 * 测试模型选择组件的用户交互行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import ModelSelect from '@/pages/Chat/components/ModelSelect';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createModelSliceState, createModelProviderSliceState } from '@/__test__/helpers/mocks';
import { asTestType } from '@/__test__/helpers/testing-utils';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 第三方库类型定义不完整
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

// Mock toastQueue
vi.mock('@/services/toast', () => ({
  toastQueue: {
    info: vi.fn(async () => 'toast-id'),
    success: vi.fn(async () => 'toast-id'),
    error: vi.fn(async () => 'toast-id'),
  },
}));

const createModelSelectStore = () => {
  const mockModels = [
    createMockModel({
      id: 'model-1',
      nickname: 'GPT-4',
      providerKey: asTestType<ModelProviderKeyEnum>('deepseek'),
      modelName: 'gpt-4',
      providerName: 'OpenAI',
    }),
    createMockModel({
      id: 'model-2',
      nickname: 'Claude 3',
      providerKey: asTestType<ModelProviderKeyEnum>('moonshotai'),
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

  return createTypeSafeTestStore({
    models: createModelSliceState({
      models: mockModels,
    }),
    modelProvider: createModelProviderSliceState({
      providers: [
        { providerKey: 'openai', providerName: 'OpenAI', api: 'https://api.openai.com', models: [] },
        { providerKey: 'anthropic', providerName: 'Anthropic', api: 'https://api.anthropic.com', models: [] },
        { providerKey: 'deepseek', providerName: 'DeepSeek', api: 'https://api.deepseek.com', models: [] },
      ],
    }),
    chat: createChatSliceState({
      chatList: [createMockChat({ id: 'chat-1', name: 'Test Chat' })],
      selectedChatId: 'chat-1',
    }),
  });
};

const createWrapper = (store: ReturnType<typeof createModelSelectStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        {children}
      </Provider>
    );
  };
};

describe('ModelSelect 用户交互测试', () => {
  let store: ReturnType<typeof createModelSelectStore>;

  beforeEach(() => {
    store = createModelSelectStore();
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
      render(<ModelSelect />, { wrapper });

      // 使用 ARIA role 验证表格存在
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });

    it('应该渲染确认按钮', () => {
      const wrapper = createWrapper(store);
      render(<ModelSelect />, { wrapper });

      // 验证确认按钮存在
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  /**
   * 模型数据渲染验证
   */
  describe('模型数据渲染', () => {
    it('应该在表格中渲染模型名称', () => {
      const wrapper = createWrapper(store);
      render(<ModelSelect />, { wrapper });

      // 模型 nickname 会出现在表格行中
      expect(screen.getAllByText('GPT-4').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Claude 3').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DeepSeek').length).toBeGreaterThan(0);
    });

    it('应该在表格中渲染与 store 模型数量对应的行', () => {
      const wrapper = createWrapper(store);
      render(<ModelSelect />, { wrapper });

      // 使用 ARIA role 验证表格行数
      const tables = screen.getAllByRole('table');
      const rows = within(tables[0]).getAllByRole('row');
      // 表头 + 3 行数据 = 4 行
      expect(rows.length).toBe(4);
    });
  });

  /**
   * 用户选择交互验证
   */
  describe('用户选择交互', () => {
    it('应该在未选择模型时点击确认显示提示', async () => {
      const { toastQueue } = await import('@/services/toast');
      const wrapper = createWrapper(store);
      render(<ModelSelect />, { wrapper });

      // 找到确认按钮（使用 getByRole 以避免文本匹配问题）
      const confirmButtons = screen.getAllByRole('button');
      const confirmButton = confirmButtons.find(btn => btn.textContent?.includes('确认'));
      expect(confirmButton).toBeDefined();
      fireEvent.click(confirmButton!);

      expect(toastQueue.info).toHaveBeenCalledWith('请选择至少一个模型');
    });

    it('确认按钮应该可点击', () => {
      const wrapper = createWrapper(store);
      render(<ModelSelect />, { wrapper });

      const confirmButtons = screen.getAllByRole('button');
      const confirmButton = confirmButtons.find(btn => btn.textContent?.includes('确认'));
      expect(confirmButton).toBeDefined();
      expect(confirmButton).not.toBeDisabled();
    });
  });
});

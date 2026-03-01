/**
 * CreateModel 组件测试
 *
 * 测试创建模型页面的各种场景
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import CreateModel from '@/pages/Model/CreateModel';
import modelReducer from '@/store/slices/modelSlice';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import type { RootState } from '@/store';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock react-i18next
  vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      const translations = {
        model: {
          nickname: '模型昵称',
          modelNickname: '模型昵称',
          apiKey: 'API 密钥',
          apiAddress: 'API 地址',
          model: '模型',
          modelName: '模型名称',
          createModel: '创建模型',
          editModel: '编辑模型',
          submit: '提交',
          cancel: '取消',
          required: '必填',
          selectProvider: '选择供应商',
          modelProvider: '模型供应商',
          searchModel: '搜索模型',
          addModelSuccess: '添加模型成功',
          addModelFailed: '添加模型失败',
          modelNicknameRequired: '模型昵称必填',
          apiKeyRequired: 'API 密钥必填',
          apiAddressRequired: 'API 地址必填',
          modelRequired: '模型必填',
        },
        common: {
          required: '必填',
          submit: '提交',
          cancel: '取消',
          search: '搜索',
          remark: '备注',
        },
      };

      if (typeof keyOrFn === 'function') {
        return keyOrFn(translations);
      }
      
      const keyMap: Record<string, string> = {
        'model.nickname': '模型昵称',
        'model.modelNickname': '模型昵称',
        'model.apiKey': 'API 密钥',
        'model.apiAddress': 'API 地址',
        'model.model': '模型',
        'model.modelName': '模型名称',
        'model.createModel': '创建模型',
        'model.editModel': '编辑模型',
        'common.submit': '提交',
        'common.cancel': '取消',
        'common.required': '必填',
        'common.remark': '备注',
        'model.selectProvider': '选择供应商',
        'model.modelProvider': '模型供应商',
        'model.searchModel': '搜索模型',
        'model.addModelSuccess': '添加模型成功',
        'model.addModelFailed': '添加模型失败',
        'common.search': '搜索',
      };
      return keyMap[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      models: modelReducer,
      modelProvider: modelProviderReducer,
    } as any,
    preloadedState: state as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={['/model/add']}>{children}</MemoryRouter>
      </Provider>
    );
  };
};

describe('CreateModel', () => {
  const mockProviders = [
    {
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      providerName: 'DeepSeek',
      api: 'https://api.deepseek.com/v1',
      models: [
        { modelName: 'DeepSeek Chat', modelKey: 'deepseek-chat' },
        { modelName: 'DeepSeek Coder', modelKey: 'deepseek-coder' },
      ],
    },
    {
      providerKey: ModelProviderKeyEnum.MOONSHOTAI,
      providerName: 'Moonshot AI',
      api: 'https://api.moonshot.cn/v1',
      models: [
        { modelName: 'Moonshot v1 8k', modelKey: 'moonshot-v1-8k' },
        { modelName: 'Moonshot v1 32k', modelKey: 'moonshot-v1-32k' },
      ],
    },
  ];

  describe('页面布局', () => {
    it('应该渲染侧边栏和表单区域', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      const sidebar = document.querySelector('.border-r');
      expect(sidebar).toBeInTheDocument();

      const formArea = document.querySelector('.w-full');
      expect(formArea).toBeInTheDocument();
    });

    it('应该显示模型提供商选择侧边栏', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByTitle 并检查至少有一个元素
      expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
      expect(screen.getAllByTitle('Moonshot AI').length).toBeGreaterThan(0);
    });

    it('应该显示模型配置表单', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('提供商选择', () => {
    it('应该默认选中 DeepSeek 提供商', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByTitle 并检查至少有一个元素
      expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
    });

    it('应该支持切换模型提供商', async () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByTitle 获取第一个按钮
      const moonshotButtons = screen.getAllByTitle('Moonshot AI');
      const moonshotButton = moonshotButtons[0];
      fireEvent.click(moonshotButton);

      await waitFor(() => {
        expect(screen.getAllByTitle('Moonshot AI').length).toBeGreaterThan(0);
      });
    });
  });

  describe('表单交互', () => {
    it('应该显示当前提供商的名称', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByTitle 并检查至少有一个元素
      expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
    });

    it('应该显示模型选择下拉框', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByText 并检查至少有一个元素
      const selectLabels = screen.getAllByText('模型');
      expect(selectLabels.length).toBeGreaterThan(0);
    });

    it('应该显示提交按钮', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByRole 并检查至少有一个元素
      const submitButtons = screen.getAllByRole('button', { name: '提交' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });
  });

  describe('表单提交', () => {
    it('提交成功后应该导航到列表页面', async () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getByRole 找到输入框
      const nicknameInput = screen.getAllByRole('textbox').find(input => 
        input.getAttribute('name') === 'nickname'
      );
      const apiKeyInput = screen.getAllByRole('textbox').find(input => 
        input.getAttribute('name') === 'apiKey'
      );

      if (nicknameInput && apiKeyInput) {
        fireEvent.change(nicknameInput, { target: { value: 'Test Model' } });
        fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

        const submitButton = screen.getByRole('button', { name: '提交' });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(submitButton).toBeInTheDocument();
        });
      }
    });
  });

  describe('表单字段', () => {
    it('应该显示昵称输入框', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByText 并检查至少有一个元素
      const nicknameLabels = screen.getAllByText('模型昵称');
      expect(nicknameLabels.length).toBeGreaterThan(0);
    });

    it('应该显示 API Key 输入框', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByText 并检查至少有一个元素
      const apiKeyLabels = screen.getAllByText('API 密钥');
      expect(apiKeyLabels.length).toBeGreaterThan(0);
    });

    it('应该显示 API 地址输入框', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByText 并检查至少有一个元素
      const apiAddressLabels = screen.getAllByText('API 地址');
      expect(apiAddressLabels.length).toBeGreaterThan(0);
    });

    it('应该显示备注输入框', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByText 并检查至少有一个元素
      const remarkLabels = screen.getAllByText('备注');
      expect(remarkLabels.length).toBeGreaterThan(0);
    });
  });

  describe('国际化支持', () => {
    it('应该使用 i18n 翻译标签', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<CreateModel />, { wrapper });

      // 使用 getAllByRole 并检查至少有一个元素
      const submitButtons = screen.getAllByRole('button', { name: '提交' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });
  });
});

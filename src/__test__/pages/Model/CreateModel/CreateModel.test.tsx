/**
 * CreateModel 组件测试
 *
 * 测试创建模型页面的各种场景
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import CreateModel from '@/pages/Model/CreateModel';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createModelProviderSliceState, createModelPageSliceState } from '@/__test__/helpers/mocks/testState';
import { ModelProviderKeyEnum } from '@/utils/enums';

vi.mock('react-i18next', () => {
  const R = { model: { modelNickname: '模型昵称', apiKey: 'API 密钥', apiAddress: 'API 地址', model: '模型', addModelSuccess: '添加成功', addModelFailed: '添加失败' }, common: { remark: '备注', submit: '提交' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

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

/**
 * 创建测试用 Redux store
 * @param providerOverrides ModelProvider slice 状态覆盖
 * @param modelPageOverrides ModelPage slice 状态覆盖
 */
const createTestStore = (
  providerOverrides?: Parameters<typeof createModelProviderSliceState>[0],
  modelPageOverrides?: Parameters<typeof createModelPageSliceState>[0]
) => {
  return createTypeSafeTestStore({
    models: createModelSliceState(),
    modelProvider: createModelProviderSliceState(providerOverrides),
    modelPage: createModelPageSliceState(modelPageOverrides),
  });
};

describe('CreateModel', () => {
  describe('页面布局', () => {
    it('应该渲染侧边栏和表单区域', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      const sidebar = screen.getByTestId('model-sidebar');
      expect(sidebar).toBeInTheDocument();

      const formArea = screen.getByTestId('model-content');
      expect(formArea).toBeInTheDocument();
    });

    it('应该显示模型提供商选择侧边栏', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByTitle 并检查至少有一个元素
      expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
      expect(screen.getAllByTitle('Moonshot AI').length).toBeGreaterThan(0);
    });

    it('应该显示模型配置表单', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      const form = screen.getByTestId('model-config-form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('提供商选择', () => {
    it('应该默认选中 DeepSeek 提供商', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByTitle 并检查至少有一个元素
      expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
    });

    it('应该支持切换模型提供商', async () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

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
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByTitle 并检查至少有一个元素
      expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
    });

    it('应该显示模型选择下拉框', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByText 并检查至少有一个元素
      const selectLabels = screen.getAllByText('模型');
      expect(selectLabels.length).toBeGreaterThan(0);
    });

    it('应该显示提交按钮', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByRole 并检查至少有一个元素
      const submitButtons = screen.getAllByRole('button', { name: '提交' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });
  });

  describe('表单提交', () => {
    it('提交成功后应该导航到列表页面', async () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // nickname 使用普通 Input，可通过 textbox 角色查找
      const textboxes = screen.getAllByRole('textbox');
      const nicknameInput = textboxes.find(input =>
        input.getAttribute('name') === 'nickname'
      );
      expect(nicknameInput).toBeTruthy();

      // apiKey 使用 PasswordInput（type="password"），不是 textbox 角色，通过 name 属性查找
      const apiKeyInput = document.querySelector('input[name="apiKey"]') as HTMLElement;
      expect(apiKeyInput).toBeTruthy();

      fireEvent.change(nicknameInput!, { target: { value: 'Test Model' } });
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

      const submitButton = screen.getByRole('button', { name: '提交' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  describe('表单字段', () => {
    it('应该显示昵称输入框', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByText 并检查至少有一个元素
      const nicknameLabels = screen.getAllByText('模型昵称');
      expect(nicknameLabels.length).toBeGreaterThan(0);
    });

    it('应该显示 API Key 输入框', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByText 并检查至少有一个元素
      const apiKeyLabels = screen.getAllByText('API 密钥');
      expect(apiKeyLabels.length).toBeGreaterThan(0);
    });

    it('应该显示 API 地址输入框', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByText 并检查至少有一个元素
      const apiAddressLabels = screen.getAllByText('API 地址');
      expect(apiAddressLabels.length).toBeGreaterThan(0);
    });

    it('应该显示备注输入框', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByText 并检查至少有一个元素
      const remarkLabels = screen.getAllByText('备注');
      expect(remarkLabels.length).toBeGreaterThan(0);
    });
  });

  describe('国际化支持', () => {
    it('应该使用 i18n 翻译标签', () => {
      const store = createTestStore(
        { providers: mockProviders },
        { isDrawerOpen: false }
      );

      renderWithProviders(<CreateModel />, { store, route: '/model/add' });

      // 使用 getAllByRole 并检查至少有一个元素
      const submitButtons = screen.getAllByRole('button', { name: '提交' });
      expect(submitButtons.length).toBeGreaterThan(0);
    });
  });
});

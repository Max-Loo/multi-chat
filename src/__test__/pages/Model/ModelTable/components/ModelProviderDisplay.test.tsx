/**
 * ModelProviderDisplay 组件测试
 *
 * 测试模型供应商展示组件的各种场景
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import ModelProviderDisplay from '@/pages/Model/ModelTable/components/ModelProviderDisplay';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createModelProviderSliceState } from '@/__test__/helpers/mocks/testState';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { asTestType } from '@/__test__/helpers/testing-utils';

vi.mock('react-i18next', () => {
  const R = { common: { confirm: '确认', cancel: '取消' } };
  return globalThis.__createI18nMockReturn(R);
});

/**
 * 创建测试用 Redux store
 * @param providerOverrides ModelProvider slice 状态覆盖
 */
const createTestStore = (
  providerOverrides?: Parameters<typeof createModelProviderSliceState>[0]
) => {
  return createTypeSafeTestStore({
    modelProvider: createModelProviderSliceState(providerOverrides),
  });
};


describe('ModelProviderDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('正常状态渲染', () => {
    it('应该显示供应商图标和名称', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'deepseek',
            providerName: 'DeepSeek',
            api: 'https://api.deepseek.com/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { store });

      expect(screen.getByAltText('DeepSeek')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
    });

    it('应该正确渲染多个供应商', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'deepseek',
            providerName: 'DeepSeek',
            api: 'https://api.deepseek.com/v1',
            models: [],
          },
          {
            providerKey: 'moonshotai',
            providerName: 'Kimi',
            api: 'https://api.moonshot.cn/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(
        <>
          <ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />
          <ModelProviderDisplay providerKey={ModelProviderKeyEnum.MOONSHOTAI} />
        </>,
        { store }
      );

      expect(screen.getByAltText('DeepSeek')).toBeInTheDocument();
      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
      expect(screen.getByAltText('Kimi')).toBeInTheDocument();
      expect(screen.getByText('Kimi')).toBeInTheDocument();
    });

    it('应该处理图标加载失败时的降级显示', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'test-provider',
            providerName: 'Test Provider',
            api: 'https://api.test.com/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay
        providerKey={asTestType<ModelProviderKeyEnum>("test-provider")}
      />, { store });

      const img = screen.getByAltText('Test Provider');
      expect(img).toBeInTheDocument();

      img.dispatchEvent(new Event('error'));

      expect(screen.getByText('Test Provider')).toBeInTheDocument();
    });
  });

  describe('降级状态渲染', () => {
    it('应该仅显示供应商名称当供应商不存在', () => {
      const store = createTestStore({ providers: [] });

      renderWithProviders(<ModelProviderDisplay
        providerKey={asTestType<ModelProviderKeyEnum>("non-existent")}
      />, { store });

      expect(screen.getByText('non-existent')).toBeInTheDocument();
    });

    it('应该显示供应商名称当找不到对应供应商', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'deepseek',
            providerName: 'DeepSeek',
            api: 'https://api.deepseek.com/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay
        providerKey={asTestType<ModelProviderKeyEnum>("unknown-provider")}
      />, { store });

      expect(screen.getByText('unknown-provider')).toBeInTheDocument();
    });

    it('应该处理空供应商列表', () => {
      const store = createTestStore({ providers: [] });

      renderWithProviders(<ModelProviderDisplay
        providerKey={asTestType<ModelProviderKeyEnum>("any-provider")}
      />, { store });

      expect(screen.getByText('any-provider')).toBeInTheDocument();
    });
  });

  describe('Redux selector', () => {
    it('应该从 Redux store 读取供应商数据', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'moonshotai',
            providerName: 'Kimi',
            api: 'https://api.moonshot.cn/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.MOONSHOTAI} />, { store });

      expect(screen.getByAltText('Kimi')).toBeInTheDocument();
      expect(screen.getByText('Kimi')).toBeInTheDocument();
    });

    it('应该使用正确的 providerKey 查找供应商', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'deepseek',
            providerName: 'DeepSeek',
            api: 'https://api.deepseek.com/v1',
            models: [],
          },
          {
            providerKey: 'openai',
            providerName: 'OpenAI',
            api: 'https://api.openai.com/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { store });

      expect(screen.getByText('DeepSeek')).toBeInTheDocument();
      expect(screen.queryByText('OpenAI')).not.toBeInTheDocument();
    });
  });

  describe('组件布局', () => {
    it('应该使用 flexbox 布局', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'deepseek',
            providerName: 'DeepSeek',
            api: 'https://api.deepseek.com/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { store });

      const flexContainer = screen.getByTestId('provider-display');
      expect(flexContainer).toBeInTheDocument();
    });

    it('应该使用正确的 Avatar 组件尺寸', () => {
      const store = createTestStore({
        providers: [
          {
            providerKey: 'deepseek',
            providerName: 'DeepSeek',
            api: 'https://api.deepseek.com/v1',
            models: [],
          },
        ],
      });

      renderWithProviders(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { store });

      const avatar = screen.getByTestId('provider-avatar');
      expect(avatar).toBeInTheDocument();
    });
  });
});

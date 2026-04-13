/**
 * ModelProviderDisplay 组件测试
 *
 * 测试模型供应商展示组件的各种场景
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import React from 'react';
import ModelProviderDisplay from '@/pages/Model/ModelTable/components/ModelProviderDisplay';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createModelProviderSliceState } from '@/__test__/helpers/mocks/testState';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
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
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { wrapper });

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
      const wrapper = createWrapper(store);

      render(
        <>
          <ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />
          <ModelProviderDisplay providerKey={ModelProviderKeyEnum.MOONSHOTAI} />
        </>,
        { wrapper }
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
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 测试非枚举值的降级处理
        providerKey={"test-provider" as any}
      />, { wrapper });

      const img = screen.getByAltText('Test Provider');
      expect(img).toBeInTheDocument();

      img.dispatchEvent(new Event('error'));

      expect(screen.getByText('Test Provider')).toBeInTheDocument();
    });
  });

  describe('降级状态渲染', () => {
    it('应该仅显示供应商名称当供应商不存在', () => {
      const store = createTestStore({ providers: [] });
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 测试非枚举值的降级处理
        providerKey={"non-existent" as any}
      />, { wrapper });

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
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 测试非枚举值的降级处理
        providerKey={"unknown-provider" as any}
      />, { wrapper });

      expect(screen.getByText('unknown-provider')).toBeInTheDocument();
    });

    it('应该处理空供应商列表', () => {
      const store = createTestStore({ providers: [] });
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 测试非枚举值的降级处理
        providerKey={"any-provider" as any}
      />, { wrapper });

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
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.MOONSHOTAI} />, { wrapper });

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
      const wrapper = createWrapper(store);

      render(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { wrapper });

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
      const wrapper = createWrapper(store);

      const { container } = render(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { wrapper });

      const flexContainer = container.querySelector('.flex.items-center.gap-2');
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
      const wrapper = createWrapper(store);

      const { container } = render(<ModelProviderDisplay providerKey={ModelProviderKeyEnum.DEEPSEEK} />, { wrapper });

      const avatar = container.querySelector('.h-6.w-6');
      expect(avatar).toBeInTheDocument();
    });
  });
});

/**
 * ProviderGrid 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ProviderGrid.test.tsx，保留核心语义：
 * - 空列表渲染空状态提示
 * - 非空列表渲染对应数量的卡片
 * - 有模型 → 可用、无模型 → 不可用
 * - 点击卡片触发 toggle-provider 并传入 providerKey
 * - 展开状态正确传递
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

// Mock Masonry（布局有专项测试），透传默认插槽
vi.mock('@/components/Masonry', () => ({
  __esModule: true,
  Masonry: {
    __isTeleport: false,
    template: '<div data-testid="masonry"><slot /></div>',
  },
}));

import ProviderGrid from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderGrid.vue';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 创建测试供应商 */
function createProvider(
  key: string,
  name: string,
  modelCount: number,
): RemoteProviderData {
  return {
    providerKey: key,
    providerName: name,
    api: `https://api.${key}.com`,
    models: Array.from({ length: modelCount }, (_, i) => ({
      modelKey: `${key}-model-${i}`,
      modelName: `Model ${i}`,
    })),
  };
}

describe('ProviderGrid（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('providers 为空数组时渲染空状态提示', () => {
    render(ProviderGrid, { props: { providers: [], expandedProviders: new Set<string>() } });

    expect(screen.getByText('暂无模型供应商数据')).toBeInTheDocument();
  });

  it('providers 非空时渲染正确数量的 ProviderCard', () => {
    render(ProviderGrid, {
      props: {
        providers: [
          createProvider('p1', 'Provider 1', 1),
          createProvider('p2', 'Provider 2', 0),
        ],
        expandedProviders: new Set<string>(),
      },
    });

    expect(screen.getAllByTestId('provider-card')).toHaveLength(2);
    expect(screen.getByText('Provider 1')).toBeInTheDocument();
    expect(screen.getByText('Provider 2')).toBeInTheDocument();
  });

  it('有模型的供应商显示可用状态', () => {
    render(ProviderGrid, {
      props: {
        providers: [createProvider('p1', 'Provider 1', 3)],
        expandedProviders: new Set<string>(),
      },
    });

    expect(screen.getByText('可用')).toBeInTheDocument();
  });

  it('无模型的供应商显示不可用状态', () => {
    render(ProviderGrid, {
      props: {
        providers: [createProvider('p1', 'Provider 1', 0)],
        expandedProviders: new Set<string>(),
      },
    });

    expect(screen.getByText('不可用')).toBeInTheDocument();
  });

  it('点击卡片触发 toggle-provider 并传入 providerKey', async () => {
    const { emitted } = render(ProviderGrid, {
      props: {
        providers: [createProvider('p-key', 'Provider X', 1)],
        expandedProviders: new Set<string>(),
      },
    });

    await fireEvent.click(screen.getByTestId('provider-card'));

    expect(emitted('toggle-provider')).toEqual([['p-key']]);
  });

  it('展开状态正确传递给 ProviderCard', () => {
    render(ProviderGrid, {
      props: {
        providers: [createProvider('p1', 'Provider 1', 1)],
        expandedProviders: new Set<string>(['p1']),
      },
    });

    expect(screen.getByTestId('provider-card')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByTestId('provider-card-details')).toBeInTheDocument();
  });
});

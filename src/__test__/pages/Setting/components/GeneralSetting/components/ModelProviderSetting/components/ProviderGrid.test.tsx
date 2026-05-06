import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderGrid } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderGrid';
import {
  createMockRemoteProvider,
  createDeepSeekProvider,
  createKimiProvider,
} from '@/__test__/helpers/fixtures/modelProvider';

vi.mock('react-masonry-css', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="masonry">{children}</div>
  ),
}));

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    setting: {
      modelProvider: {
        status: { available: '可用', unavailable: '不可用' },
        modelCount: '共 {{count}} 个模型',
        clickToViewDetails: '点击查看详情',
        apiEndpoint: 'API 端点',
        providerId: '供应商 ID',
        viewDocs: '查看文档',
        searchPlaceholder: '搜索模型',
        searchResult: '找到 {{count}} 个模型',
        totalModels: '共 {{count}} 个模型',
      },
    },
  })
);

describe('ProviderGrid', () => {
  describe('空供应商列表渲染', () => {
    it('providers 为空数组时渲染空状态提示', () => {
      render(
        <ProviderGrid
          providers={[]}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByText('暂无模型供应商数据')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-card')).not.toBeInTheDocument();
    });
  });

  describe('非空供应商列表渲染', () => {
    it('providers 非空时渲染正确数量的 ProviderCard 组件', () => {
      const providers = [createDeepSeekProvider(), createKimiProvider()];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getAllByTestId('provider-card')).toHaveLength(2);
    });
  });

  describe('供应商状态判断', () => {
    it('有模型的供应商显示可用状态', () => {
      const providers = [createDeepSeekProvider()];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByText('可用')).toBeInTheDocument();
    });

    it('无模型的供应商显示不可用状态', () => {
      const providers = [createMockRemoteProvider({ models: [] })];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByText('不可用')).toBeInTheDocument();
    });

    it('混合状态同时显示可用和不可用', () => {
      const providers = [
        createDeepSeekProvider(),
        createKimiProvider({ models: [] }),
      ];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByText('可用')).toBeInTheDocument();
      expect(screen.getByText('不可用')).toBeInTheDocument();
    });
  });

  describe('展开/折叠交互', () => {
    it('点击卡片触发 onToggleProvider 回调并传入 providerKey', () => {
      const onToggleProvider = vi.fn();
      const providers = [createDeepSeekProvider()];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={onToggleProvider}
        />
      );

      fireEvent.click(screen.getByTestId('provider-card'));
      expect(onToggleProvider).toHaveBeenCalledWith('deepseek');
    });

    it('展开状态正确传递给 ProviderCard', () => {
      const providers = [createDeepSeekProvider()];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set(['deepseek'])}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByTestId('provider-card')).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('收起状态正确传递给 ProviderCard', () => {
      const providers = [createDeepSeekProvider()];

      render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByTestId('provider-card')).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    });
  });

  describe('React.memo 和重新渲染', () => {
    it('props 不变时保持渲染结果', () => {
      const providers = [createDeepSeekProvider()];
      const expandedProviders = new Set<string>();
      const onToggleProvider = vi.fn();

      const { rerender } = render(
        <ProviderGrid
          providers={providers}
          expandedProviders={expandedProviders}
          onToggleProvider={onToggleProvider}
        />
      );

      expect(screen.getAllByTestId('provider-card')).toHaveLength(1);

      rerender(
        <ProviderGrid
          providers={providers}
          expandedProviders={expandedProviders}
          onToggleProvider={onToggleProvider}
        />
      );

      expect(screen.getAllByTestId('provider-card')).toHaveLength(1);
    });

    it('改变 providers 时重新渲染', () => {
      const providers = [createDeepSeekProvider()];

      const { rerender } = render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getAllByTestId('provider-card')).toHaveLength(1);

      rerender(
        <ProviderGrid
          providers={[createDeepSeekProvider(), createKimiProvider()]}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getAllByTestId('provider-card')).toHaveLength(2);
    });

    it('改变 expandedProviders 时更新展开状态', () => {
      const providers = [createDeepSeekProvider()];

      const { rerender } = render(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set()}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByTestId('provider-card')).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <ProviderGrid
          providers={providers}
          expandedProviders={new Set(['deepseek'])}
          onToggleProvider={vi.fn()}
        />
      );

      expect(screen.getByTestId('provider-card')).toHaveAttribute('aria-expanded', 'true');
    });

    it('连续多次 rerender 覆盖 memo 比较分支', () => {
      const providers = [createDeepSeekProvider()];
      const expandedProviders = new Set<string>();
      const onToggleProvider = vi.fn();

      const { rerender } = render(
        <ProviderGrid
          providers={providers}
          expandedProviders={expandedProviders}
          onToggleProvider={onToggleProvider}
        />
      );

      rerender(
        <ProviderGrid
          providers={providers}
          expandedProviders={expandedProviders}
          onToggleProvider={onToggleProvider}
        />
      );

      rerender(
        <ProviderGrid
          providers={[createDeepSeekProvider(), createKimiProvider()]}
          expandedProviders={expandedProviders}
          onToggleProvider={onToggleProvider}
        />
      );

      rerender(
        <ProviderGrid
          providers={[createDeepSeekProvider(), createKimiProvider()]}
          expandedProviders={new Set(['deepseek'])}
          onToggleProvider={onToggleProvider}
        />
      );

      expect(screen.getAllByTestId('provider-card')).toHaveLength(2);
    });
  });
});

/**
 * ProviderCard 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ProviderCard.test.tsx 与 ProviderCardHeader /
 * ProviderCardSummary 测试，保留核心语义：
 * - 渲染供应商名称、状态徽章、模型数量
 * - 点击/键盘（Enter/Space）触发展开事件
 * - 展开时显示详情、收起时隐藏
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

// Mock 详情区（搜索/列表逻辑有专项测试）
vi.mock('@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardDetails.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['provider'],
    template: '<div data-testid="mock-card-details" />',
  },
}));

import ProviderCard from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCard.vue';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 创建测试供应商 */
function createProvider(overrides?: Partial<RemoteProviderData>): RemoteProviderData {
  return {
    providerKey: 'deepseek',
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com',
    models: [
      { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
      { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
    ],
    ...overrides,
  };
}

/** 渲染 ProviderCard */
function renderCard(options?: {
  provider?: RemoteProviderData;
  isExpanded?: boolean;
  status?: 'available' | 'unavailable';
}) {
  const result = render(ProviderCard, {
    props: {
      provider: options?.provider ?? createProvider(),
      isExpanded: options?.isExpanded ?? false,
      status: options?.status ?? 'available',
    },
  });
  return { ...result, emitted: result.emitted };
}

describe('ProviderCard（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染供应商名称', () => {
    renderCard();

    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('应该显示可用状态徽章', () => {
    renderCard({ status: 'available' });

    expect(screen.getByText('可用')).toBeInTheDocument();
  });

  it('应该显示不可用状态徽章', () => {
    renderCard({ status: 'unavailable' });

    expect(screen.getByText('不可用')).toBeInTheDocument();
  });

  it('应该显示模型数量', () => {
    renderCard();

    expect(screen.getByText('共 2 个模型')).toBeInTheDocument();
  });

  it('点击时应该调用展开事件', async () => {
    const { emitted } = renderCard();

    await fireEvent.click(screen.getByTestId('provider-card'));

    expect(emitted('toggle-provider')).toHaveLength(1);
  });

  it('展开时应该显示详细信息', () => {
    renderCard({ isExpanded: true });

    expect(screen.getByTestId('provider-card-details')).toBeInTheDocument();
    expect(screen.queryByText('点击查看详情')).not.toBeInTheDocument();
  });

  it('收起时不应该显示模型列表详情', () => {
    renderCard({ isExpanded: false });

    expect(
      screen.queryByTestId('provider-card-details'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('点击查看详情')).toBeInTheDocument();
  });

  it('应该正确渲染展开/折叠图标状态', () => {
    const { unmount } = renderCard({ isExpanded: false });
    // 收起时卡片 aria-expanded=false
    expect(screen.getByTestId('provider-card')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    unmount();

    renderCard({ isExpanded: true });
    expect(screen.getByTestId('provider-card')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  describe('键盘交互', () => {
    it('按下 Enter 键应调用展开事件', async () => {
      const { emitted } = renderCard();

      await fireEvent.keyDown(screen.getByTestId('provider-card'), {
        key: 'Enter',
      });

      expect(emitted('toggle-provider')).toHaveLength(1);
    });

    it('按下 Space 键应调用展开事件', async () => {
      const { emitted } = renderCard();

      await fireEvent.keyDown(screen.getByTestId('provider-card'), {
        key: ' ',
      });

      expect(emitted('toggle-provider')).toHaveLength(1);
    });
  });
});

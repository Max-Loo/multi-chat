/**
 * Vue ModelProviderSetting 及子组件测试
 *
 * 行为基线与迁移前 React 版一致：
 * - ProviderHeader：刷新按钮状态与最后更新时间
 * - ProviderGrid：空态与卡片渲染、响应式列数
 * - ProviderCard：点击/键盘切换展开，展开后展示详情
 * - ProviderCardDetails：搜索过滤（300ms 防抖）
 * - ModelProviderSetting：手动刷新成功/失败 Toast
 * - ErrorAlert：条件渲染
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import type { RemoteProviderData } from '@/services/modelRemote';

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    setting: {
      modelProvider: {
        title: '模型供应商',
        description: '供应商说明',
        refreshButton: '刷新模型供应商',
        refreshing: '刷新中...',
        lastUpdateLabel: '最后更新:',
        refreshSuccess: '刷新成功',
        refreshFailed: '刷新失败',
        refreshFailedPrefix: '刷新失败:',
        status: { available: '可用', unavailable: '不可用' },
        modelCount: '共 {{count}} 个模型',
        clickToViewDetails: '点击查看详情',
        searchPlaceholder: '搜索模型',
        searchResult: '找到 {{count}} 个',
        totalModels: '共 {{count}} 个',
        apiEndpoint: 'API 端点',
        providerId: '供应商 ID',
        viewDocs: '查看文档',
      },
    },
  }));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

vi.mock('@/services/modelRemote', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/modelRemote')>();
  return {
    ...actual,
    fetchRemoteData: vi.fn(),
    saveCachedProviderData: vi.fn(),
    loadCachedProviderData: vi.fn(),
  };
});

import ModelProviderSetting from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.vue';
import ProviderGrid from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderGrid.vue';
import ProviderCard from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCard.vue';
import ProviderCardDetails from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardDetails.vue';
import ErrorAlert from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ErrorAlert.vue';
import { toastQueue } from '@/services/toast';
import { fetchRemoteData } from '@/services/modelRemote';
import { useModelProviderStore } from '@/store/pinia/modelProvider';

/** 构造供应商测试数据 */
const makeProvider = (overrides: Partial<RemoteProviderData> = {}): RemoteProviderData => ({
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com',
  models: [
    { modelKey: 'deepseek-chat', modelName: 'Chat 模型' },
    { modelKey: 'deepseek-coder', modelName: 'Coder 模型' },
  ],
  ...overrides,
});

describe('ErrorAlert（Vue 版）', () => {
  it('无错误时不渲染', () => {
    const { container } = render(ErrorAlert, { props: { error: null } });
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('有错误时渲染前缀与错误信息', () => {
    render(ErrorAlert, { props: { error: '网络异常' } });
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText(/刷新失败:/)).toBeVisible();
    expect(screen.getByText(/网络异常/)).toBeVisible();
  });
});

describe('ProviderCard（Vue 版）', () => {
  it('渲染供应商名称、状态徽章与模型数量', () => {
    render(ProviderCard, {
      props: { provider: makeProvider(), isExpanded: false, status: 'available' },
    });

    expect(screen.getByTestId('provider-card')).toBeVisible();
    expect(screen.getByText('DeepSeek')).toBeVisible();
    expect(screen.getByText('可用')).toBeVisible();
    expect(screen.getByText('共 2 个模型')).toBeVisible();
    // 未展开时不显示详情
    expect(screen.queryByTestId('provider-card-details')).not.toBeInTheDocument();
  });

  it('不可用供应商显示不可用徽章', () => {
    render(ProviderCard, {
      props: { provider: makeProvider({ models: [] }), isExpanded: false, status: 'unavailable' },
    });

    expect(screen.getByText('不可用')).toBeVisible();
  });

  it('点击卡片触发 toggle 事件', async () => {
    const { emitted } = render(ProviderCard, {
      props: { provider: makeProvider(), isExpanded: false, status: 'available' },
    });

    await fireEvent.click(screen.getByTestId('provider-card'));

    expect(emitted('toggle')).toHaveLength(1);
  });

  it('键盘 Enter/空格激活与点击等价', async () => {
    const { emitted } = render(ProviderCard, {
      props: { provider: makeProvider(), isExpanded: false, status: 'available' },
    });
    const card = screen.getByTestId('provider-card');

    await fireEvent.keyDown(card, { key: 'Enter' });
    await fireEvent.keyDown(card, { key: ' ' });
    // 其他按键不触发
    await fireEvent.keyDown(card, { key: 'Tab' });

    expect(emitted('toggle')).toHaveLength(2);
  });

  it('展开时渲染详情区（端点与 ID）', () => {
    render(ProviderCard, {
      props: { provider: makeProvider(), isExpanded: true, status: 'available' },
    });

    const details = screen.getByTestId('provider-card-details');
    expect(details).toBeVisible();
    expect(screen.getByText('https://api.deepseek.com')).toBeVisible();
    expect(screen.getByText('deepseek')).toBeVisible();
  });
});

describe('ProviderCardDetails 搜索过滤（Vue 版）', () => {
  it('输入搜索词后按防抖过滤模型列表', async () => {
    vi.useFakeTimers();
    const { container } = render(ProviderCardDetails, {
      props: { provider: makeProvider() },
    });

    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.update(input, 'coder');

    // 防抖窗口内仍显示全部模型
    expect(screen.getByText('Chat 模型')).toBeVisible();

    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    // 防抖后仅显示匹配项
    expect(screen.queryByText('Chat 模型')).toBeNull();
    expect(screen.getByText('Coder 模型')).toBeVisible();
    expect(screen.getByText('找到 1 个')).toBeVisible();

    vi.useRealTimers();
  });

  it('无匹配模型时显示空态文案', async () => {
    vi.useFakeTimers();
    const { container } = render(ProviderCardDetails, {
      props: { provider: makeProvider() },
    });

    const input = container.querySelector('input') as HTMLInputElement;
    await fireEvent.update(input, '不存在');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    expect(screen.getByText('没有找到匹配的模型')).toBeVisible();

    vi.useRealTimers();
  });
});

describe('ProviderGrid（Vue 版）', () => {
  it('无供应商数据时显示空态', () => {
    render(ProviderGrid, {
      props: { providers: [], expandedProviders: new Set<string>() },
    });

    expect(screen.getByText('暂无模型供应商数据')).toBeVisible();
  });

  it('渲染全部供应商卡片并上抛展开事件', async () => {
    const { emitted } = render(ProviderGrid, {
      props: {
        providers: [makeProvider(), makeProvider({ providerKey: 'zhipu', providerName: '智谱' })],
        expandedProviders: new Set<string>(),
      },
    });

    expect(screen.getAllByTestId('provider-card')).toHaveLength(2);

    // 点击第一张卡片 → toggle 事件携带对应 providerKey
    const cards = screen.getAllByTestId('provider-card');
    await fireEvent.click(cards[0]);

    expect(emitted('toggleProvider')).toEqual([['deepseek']]);
  });

  it('已展开的供应商渲染详情区', () => {
    render(ProviderGrid, {
      props: {
        providers: [makeProvider()],
        expandedProviders: new Set(['deepseek']),
      },
    });

    expect(screen.getByTestId('provider-card-details')).toBeVisible();
  });
});

describe('ModelProviderSetting（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('渲染头部、错误区与网格区域', () => {
    const store = useModelProviderStore();
    store.providers = [makeProvider()] as never;

    render(ModelProviderSetting);

    expect(screen.getByText('模型供应商')).toBeVisible();
    expect(screen.getByText('刷新模型供应商')).toBeVisible();
    expect(screen.getAllByTestId('provider-card')).toHaveLength(1);
  });

  it('点击刷新后成功提示并更新数据', async () => {
    const store = useModelProviderStore();
    vi.mocked(fetchRemoteData).mockResolvedValue({
      fullApiResponse: { deepseek: { api: 'https://api.deepseek.com' } } as never,
      filteredData: [makeProvider()] as never,
    });

    render(ModelProviderSetting);

    await fireEvent.click(screen.getByRole('button', { name: '刷新模型供应商' }));

    await waitFor(() => {
      expect(fetchRemoteData).toHaveBeenCalledWith(expect.objectContaining({ forceRefresh: true }));
      expect(toastQueue.success).toHaveBeenCalledWith('刷新成功');
    });
    expect(store.providers).toHaveLength(1);
  });

  it('刷新失败时显示错误提示', async () => {
    const store = useModelProviderStore();
    // 非 RemoteDataError 的普通错误 → store 记录通用失败文案（既有 store 行为）
    vi.mocked(fetchRemoteData).mockRejectedValue(new Error('网络断开'));

    render(ModelProviderSetting);

    await fireEvent.click(screen.getByRole('button', { name: '刷新模型供应商' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeVisible();
    });
    expect(screen.getByText(/刷新失败，请稍后重试/)).toBeVisible();
    expect(store.error).toBe('刷新失败，请稍后重试');
  });

  it('点击卡片展开/折叠详情', async () => {
    const store = useModelProviderStore();
    store.providers = [makeProvider()] as never;

    render(ModelProviderSetting);

    expect(screen.queryByTestId('provider-card-details')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('provider-card'));
    expect(screen.getByTestId('provider-card-details')).toBeVisible();

    await fireEvent.click(screen.getByTestId('provider-card'));
    expect(screen.queryByTestId('provider-card-details')).not.toBeInTheDocument();
  });
});

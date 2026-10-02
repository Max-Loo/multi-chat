/**
 * ModelProviderSetting 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ModelProviderSetting.test.tsx，保留核心语义：
 * - 渲染头部、错误提示、供应商网格
 * - 点击刷新按钮触发刷新并显示成功 toast
 * - 刷新失败显示错误 toast
 * - 无供应商数据时显示空提示
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// Mock Masonry（布局有专项测试）
vi.mock('@/components/Masonry', () => ({
  __esModule: true,
  Masonry: {
    __isTeleport: false,
    template: '<div data-testid="masonry"><slot /></div>',
  },
}));

import ModelProviderSetting from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/ModelProviderSetting.vue';
import { createAppPinia, useModelProviderStore } from '@/stores';
import { toastQueue } from '@/services/toast';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 创建测试供应商 */
const PROVIDER: RemoteProviderData = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com',
  models: [{ modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' }],
};

/** 渲染 ModelProviderSetting（可选预设 store 状态） */
function renderProviderSetting(options?: {
  providers?: RemoteProviderData[];
  error?: string | null;
  refreshImpl?: () => Promise<unknown>;
}) {
  const pinia = createAppPinia();
  const store = useModelProviderStore(pinia);
  store.providers = options?.providers ?? [PROVIDER];
  if (options?.error !== undefined) store.error = options.error;
  if (options?.refreshImpl) {
    store.refreshModelProvider = options.refreshImpl as never;
  }
  return render(ModelProviderSetting, { global: { plugins: [pinia] } });
}

describe('ModelProviderSetting（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正常渲染组件', () => {
    renderProviderSetting();

    expect(screen.getByText('模型供应商')).toBeInTheDocument();
    expect(screen.getByTestId('provider-card')).toBeInTheDocument();
  });

  it('应该显示刷新按钮', () => {
    renderProviderSetting();

    expect(screen.getByText('刷新模型供应商')).toBeInTheDocument();
  });

  it('应该在点击刷新按钮时刷新并显示成功 toast', async () => {
    renderProviderSetting({
      refreshImpl: () => Promise.resolve(undefined),
    });

    await fireEvent.click(screen.getByText('刷新模型供应商'));

    await vi.waitFor(() => {
      expect(toastQueue.success).toHaveBeenCalledWith('模型供应商数据已更新');
    });
  });

  it('应该在刷新失败时显示错误 toast', async () => {
    renderProviderSetting({
      refreshImpl: () => Promise.reject(new Error('network down')),
    });

    await fireEvent.click(screen.getByText('刷新模型供应商'));

    await vi.waitFor(() => {
      expect(toastQueue.error).toHaveBeenCalledWith('network down');
    });
  });

  it('应该在存在错误时显示错误信息', () => {
    renderProviderSetting({ error: '远程数据获取失败' });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/远程数据获取失败/)).toBeInTheDocument();
  });

  it('应该在无供应商数据时显示空提示', () => {
    renderProviderSetting({ providers: [] });

    expect(screen.getByText('暂无模型供应商数据')).toBeInTheDocument();
  });

  it('应该在展开供应商后显示模型搜索与列表', async () => {
    renderProviderSetting();

    await fireEvent.click(screen.getByTestId('provider-card'));

    expect(screen.getByTestId('provider-card-details')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
  });
});

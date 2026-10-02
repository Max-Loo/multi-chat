/**
 * ModelProviderDisplay 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/ModelTable/components/ModelProviderDisplay.test.tsx，
 * 保留核心行为语义：
 * - 显示供应商图标与名称
 * - 供应商不存在时降级显示 providerKey
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import ModelProviderDisplay from '@/pages/Model/ModelTable/components/ModelProviderDisplay.vue';
import { createAppPinia, useModelProviderStore } from '@/stores';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 渲染 ModelProviderDisplay */
function renderDisplay(
  providerKey: ModelProviderKeyEnum,
  providers: RemoteProviderData[],
) {
  const pinia = createAppPinia();
  useModelProviderStore(pinia).providers = providers;
  return render(ModelProviderDisplay, {
    props: { providerKey },
    global: { plugins: [pinia] },
  });
}

describe('ModelProviderDisplay（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示供应商名称与图标', () => {
    renderDisplay(ModelProviderKeyEnum.DEEPSEEK, [
      {
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        providerName: 'DeepSeek',
        api: 'https://api.deepseek.com',
        models: [],
      },
    ]);

    expect(screen.getByTestId('provider-display')).toBeInTheDocument();
    expect(screen.getByTestId('provider-avatar')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('应该降级显示 providerKey 当找不到对应供应商', () => {
    renderDisplay(ModelProviderKeyEnum.MOONSHOTAI, [
      {
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        providerName: 'DeepSeek',
        api: 'https://api.deepseek.com',
        models: [],
      },
    ]);

    expect(screen.queryByTestId('provider-display')).not.toBeInTheDocument();
    expect(screen.getByText(ModelProviderKeyEnum.MOONSHOTAI)).toBeInTheDocument();
  });

  it('应该处理空供应商列表', () => {
    renderDisplay(ModelProviderKeyEnum.DEEPSEEK, []);

    expect(screen.queryByTestId('provider-display')).not.toBeInTheDocument();
  });

  it('应该正确渲染多个供应商中的指定项', () => {
    renderDisplay(ModelProviderKeyEnum.ZHIPUAI, [
      {
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        providerName: 'DeepSeek',
        api: 'https://api.deepseek.com',
        models: [],
      },
      {
        providerKey: ModelProviderKeyEnum.ZHIPUAI,
        providerName: '智谱 AI',
        api: 'https://open.bigmodel.cn',
        models: [],
      },
    ]);

    expect(screen.getByText('智谱 AI')).toBeInTheDocument();
    expect(screen.queryByText('DeepSeek')).not.toBeInTheDocument();
  });
});

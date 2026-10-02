/**
 * ProviderCardDetails 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ProviderCardDetails.test.tsx，保留核心语义：
 * - 搜索过滤模型列表（按名称/ID）
 * - 防抖 300ms 后生效
 * - 空搜索显示全部
 * - 元数据与搜索框渲染
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import ProviderCardDetails from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardDetails.vue';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 创建测试供应商（3 个模型） */
const PROVIDER: RemoteProviderData = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com/v1',
  models: [
    { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
    { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
    { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
  ],
};

describe('ProviderCardDetails（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染元数据与搜索框', () => {
    render(ProviderCardDetails, { props: { provider: PROVIDER } });

    expect(screen.getByTestId('model-search-wrapper')).toBeInTheDocument();
    expect(screen.getByText('API 端点:')).toBeInTheDocument();
    expect(screen.getByText(PROVIDER.api)).toBeInTheDocument();
  });

  it('应该渲染所有模型 当搜索框为空', () => {
    render(ProviderCardDetails, { props: { provider: PROVIDER } });

    expect(screen.getByText('共 3 个模型')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Reasoner')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Coder')).toBeInTheDocument();
  });

  it('应该过滤模型列表当用户输入搜索文本', async () => {
    vi.useFakeTimers();
    render(ProviderCardDetails, { props: { provider: PROVIDER } });

    await fireEvent.update(screen.getByTestId('model-search-input'), 'coder');
    // 防抖 300ms 后生效
    await vi.advanceTimersByTimeAsync(400);

    expect(screen.getByText('DeepSeek Coder')).toBeInTheDocument();
    expect(screen.queryByText('DeepSeek Chat')).not.toBeInTheDocument();
    expect(screen.getByText('找到 1 个模型')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('应该按模型 ID 过滤', async () => {
    vi.useFakeTimers();
    render(ProviderCardDetails, { props: { provider: PROVIDER } });

    await fireEvent.update(
      screen.getByTestId('model-search-input'),
      'deepseek-chat',
    );
    await vi.advanceTimersByTimeAsync(400);

    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
    expect(screen.queryByText('DeepSeek Coder')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('应该显示所有模型当搜索框清空', async () => {
    vi.useFakeTimers();
    render(ProviderCardDetails, { props: { provider: PROVIDER } });

    await fireEvent.update(screen.getByTestId('model-search-input'), 'coder');
    await vi.advanceTimersByTimeAsync(400);
    await fireEvent.update(screen.getByTestId('model-search-input'), '');
    await vi.advanceTimersByTimeAsync(400);

    expect(screen.getAllByText(/DeepSeek/).length).toBeGreaterThanOrEqual(3);
    vi.useRealTimers();
  });

  it('应该重置防抖计时器当用户继续输入（只触发最后一次过滤）', async () => {
    vi.useFakeTimers();
    render(ProviderCardDetails, { props: { provider: PROVIDER } });

    await fireEvent.update(screen.getByTestId('model-search-input'), 'ch');
    await vi.advanceTimersByTimeAsync(200);
    await fireEvent.update(screen.getByTestId('model-search-input'), 'chat');
    await vi.advanceTimersByTimeAsync(200);
    // 距首次输入已 400ms，但距最后一次输入仅 200ms → 过滤未生效
    expect(screen.getByText('DeepSeek Coder')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(200);
    expect(screen.queryByText('DeepSeek Coder')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

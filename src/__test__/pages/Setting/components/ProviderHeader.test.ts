/**
 * ProviderHeader 组件测试（Vue 版）
 *
 * 迁移自旧版 Setting/.../ProviderHeader.test.tsx，保留核心语义：
 * - loading 状态显示刷新中 + 禁用
 * - 非加载状态可点击刷新并 emit refresh
 * - lastUpdate 显示/隐藏
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import ProviderHeader from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderHeader.vue';

describe('ProviderHeader（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示加载文本和禁用按钮 当 loading 为 true', () => {
    render(ProviderHeader, { props: { loading: true, lastUpdate: null } });

    expect(screen.getByText('刷新中...')).toBeInTheDocument();
    expect(screen.getByText('刷新中...').closest('button')).toBeDisabled();
  });

  it('应该显示刷新文本和可点击按钮 当 loading 为 false', () => {
    render(ProviderHeader, { props: { loading: false, lastUpdate: null } });

    const button = screen.getByText('刷新模型供应商').closest('button');
    expect(button).not.toBeDisabled();
  });

  it('应该调用 refresh 事件 当点击刷新按钮', async () => {
    const { emitted } = render(ProviderHeader, {
      props: { loading: false, lastUpdate: null },
    });

    await fireEvent.click(screen.getByText('刷新模型供应商'));

    expect(emitted('refresh')).toHaveLength(1);
  });

  it('应该不显示更新时间 当 lastUpdate 为 null', () => {
    render(ProviderHeader, { props: { loading: false, lastUpdate: null } });

    expect(screen.queryByText(/最后更新:/)).not.toBeInTheDocument();
  });

  it('应该显示更新时间 当 lastUpdate 存在', () => {
    render(ProviderHeader, {
      props: { loading: false, lastUpdate: '2026-01-01T00:00:00Z' },
    });

    expect(screen.getByText(/最后更新:/)).toBeInTheDocument();
  });
});

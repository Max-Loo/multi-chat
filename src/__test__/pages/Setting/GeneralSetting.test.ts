/**
 * GeneralSetting 页面测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Setting/GeneralSetting.test.tsx，保留核心语义：
 * - 渲染语言/自动命名/模型供应商/聊天导出四个设置区域
 * - 滚动容器存在且滚动不崩溃
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/composables/useScrollContainer', () => ({
  useScrollContainer: () => ({
    scrollContainerRef: { value: null },
    scrollbarClassname: '',
  }),
}));

vi.mock('@/services/i18n', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/services/i18n')
  >();
  return {
    ...actual,
    changeAppLanguage: vi.fn(() => Promise.resolve({ success: true })),
  };
});

import GeneralSetting from '@/pages/Setting/components/GeneralSetting/index.vue';
import { createAppPinia } from '@/stores';

describe('GeneralSetting（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染语言设置区域', () => {
    render(GeneralSetting, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByTestId('language-setting')).toBeInTheDocument();
    expect(screen.getByText('语言')).toBeInTheDocument();
  });

  it('应该渲染自动命名设置区域', () => {
    render(GeneralSetting, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByText('自动命名')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('应该渲染模型供应商设置区域', () => {
    render(GeneralSetting, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByText('模型供应商')).toBeInTheDocument();
    expect(
      screen.getByText('从远程服务器获取最新的模型供应商信息'),
    ).toBeInTheDocument();
  });

  it('应该渲染聊天导出设置区域', () => {
    render(GeneralSetting, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByText('聊天导出')).toBeInTheDocument();
    expect(screen.getByText('导出活跃聊天')).toBeInTheDocument();
    expect(screen.getByText('导出已删除聊天')).toBeInTheDocument();
  });

  it('应该渲染滚动容器且触发滚动不崩溃', async () => {
    render(GeneralSetting, { global: { plugins: [createAppPinia()] } });

    const scrollContainer = screen.getByTestId('scroll-container');
    expect(scrollContainer).toBeInTheDocument();

    await fireEvent.scroll(scrollContainer);

    expect(scrollContainer).toBeInTheDocument();
  });
});

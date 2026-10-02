/**
 * ModelHeader 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/CreateModel/components/ModelHeader.test.tsx，
 * 保留核心行为语义：
 * - 桌面端仅渲染标题
 * - 移动端渲染返回按钮与菜单按钮
 * - 点击返回导航到 /model/table、点击菜单切换抽屉
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
  routerPush: vi.fn(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import ModelHeader from '@/pages/Model/CreateModel/components/ModelHeader.vue';
import { createAppPinia } from '@/stores';
import { useModelPageStore } from '@/stores';

function renderHeader() {
  const pinia = createAppPinia();
  const result = render(ModelHeader, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

describe('ModelHeader（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该渲染标题', () => {
    renderHeader();

    expect(screen.getByText('添加模型')).toBeInTheDocument();
  });

  it('应该仅在移动端渲染返回按钮和菜单按钮', () => {
    const { unmount } = renderHeader();
    // 桌面端：无按钮
    expect(screen.queryByLabelText('返回')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('打开菜单')).not.toBeInTheDocument();
    unmount();

    mocks.responsive.__set({ isMobile: true });
    renderHeader();
    // 移动端：有按钮
    expect(screen.getByLabelText('返回')).toBeInTheDocument();
    expect(screen.getByLabelText('打开菜单')).toBeInTheDocument();
  });

  it('点击返回按钮应该导航到 /model/table', async () => {
    mocks.responsive.__set({ isMobile: true });
    renderHeader();

    await fireEvent.click(screen.getByLabelText('返回'));

    expect(mocks.routerPush).toHaveBeenCalledWith('/model/table');
  });

  it('点击菜单按钮应该切换抽屉状态', async () => {
    mocks.responsive.__set({ isMobile: true });
    const { pinia } = renderHeader();
    const modelPageStore = useModelPageStore(pinia);

    await fireEvent.click(screen.getByLabelText('打开菜单'));

    expect(modelPageStore.isDrawerOpen).toBe(true);
  });
});

/**
 * SettingPage 页面测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Setting/SettingPage.test.tsx 与
 * Setting/components/SettingHeader.test.tsx，保留核心行为语义：
 * - 桌面端渲染侧边栏与内容区
 * - 移动端渲染 Header 菜单按钮与抽屉
 * - Header 菜单按钮切换抽屉状态
 * - 设置侧边栏导航（跳转、防重复）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
  routerPush: vi.fn(),
  path: '/setting/common',
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: mocks.path }),
  useRouter: () => ({ push: mocks.routerPush }),
  RouterView: { template: '<div data-testid="mock-router-view">嵌套内容</div>' },
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/composables/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => globalThis.__createScrollbarMock(),
}));

import SettingPage from '@/pages/Setting/index.vue';
import SettingHeader from '@/pages/Setting/components/SettingHeader.vue';
import SettingSidebar from '@/pages/Setting/components/SettingSidebar.vue';
import { createAppPinia } from '@/stores';
import { useSettingPageStore } from '@/stores';

describe('SettingPage（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该在桌面端渲染侧边栏与内容区', () => {
    render(SettingPage, { global: { plugins: [createAppPinia()] } });

    expect(screen.getAllByLabelText('设置导航').length).toBeGreaterThan(0);
    expect(screen.getByTestId('setting-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-router-view')).toBeInTheDocument();
  });

  it('应该在移动端渲染抽屉与 Header', () => {
    mocks.responsive.__set({ isMobile: true });

    render(SettingPage, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByText('设置')).toBeInTheDocument(); // Header 标题
    expect(screen.queryByLabelText('设置导航')).not.toBeInTheDocument(); // 侧边栏进抽屉
  });
});

describe('SettingHeader（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该在移动端渲染菜单按钮', () => {
    mocks.responsive.__set({ isMobile: true });

    render(SettingHeader, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByLabelText('打开菜单')).toBeInTheDocument();
  });

  it('应该在桌面端不渲染菜单按钮', () => {
    render(SettingHeader, { global: { plugins: [createAppPinia()] } });

    expect(screen.queryByLabelText('打开菜单')).not.toBeInTheDocument();
  });

  it('应该在点击菜单按钮时切换抽屉状态', async () => {
    mocks.responsive.__set({ isMobile: true });
    const pinia = createAppPinia();
    render(SettingHeader, { global: { plugins: [pinia] } });

    await fireEvent.click(screen.getByLabelText('打开菜单'));

    expect(useSettingPageStore(pinia).isDrawerOpen).toBe(true);
  });
});

describe('SettingSidebar（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
    mocks.path = '/setting/common';
  });

  it('应该渲染导航按钮', () => {
    render(SettingSidebar, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByText('常规设置')).toBeInTheDocument();
    expect(screen.getByText('密钥管理')).toBeInTheDocument();
  });

  it('应该在点击设置按钮时触发导航', async () => {
    render(SettingSidebar, { global: { plugins: [createAppPinia()] } });

    await fireEvent.click(screen.getByText('密钥管理'));

    expect(mocks.routerPush).toHaveBeenCalledWith('key-management');
  });

  it('应该在点击已选中按钮时不触发导航（防重复点击）', async () => {
    render(SettingSidebar, { global: { plugins: [createAppPinia()] } });

    await fireEvent.click(screen.getByText('常规设置'));

    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it('应该在平板端使用压缩按钮样式', () => {
    mocks.responsive.__set({ isCompact: true, isDesktop: false });

    const { container } = render(SettingSidebar, {
      global: { plugins: [createAppPinia()] },
    });

    const button = container.querySelector('button');
    expect(button?.className).toContain('h-9');
  });
});

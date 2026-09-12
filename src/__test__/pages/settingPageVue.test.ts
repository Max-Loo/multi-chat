/**
 * Vue Setting 页测试（外壳 + Header + Sidebar）
 *
 * 行为基线与迁移前 React 版一致：
 * - 桌面端固定侧边栏 + 内容区嵌套路由
 * - 移动端抽屉 + Header 菜单按钮开关抽屉
 * - 侧边栏按钮导航与防重复点击
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent } from '@testing-library/vue';

// 可变 route/router mock（按用例切换路径与断言 push 调用）
const mockRoute = vi.hoisted(() => ({ path: '/setting' }));
const mockPush = vi.hoisted(() => vi.fn());

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  RouterView: { template: '<div data-testid="router-view-stub" />' },
}));

// 可变响应式 mock（桌面/移动切换）
const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

// Mock 响应式 i18n 绑定（沿用项目 i18n mock 惯例）
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    common: { a11y: { settingsNav: '设置导航' } },
    navigation: { mobileDrawer: { title: '侧边栏', ariaDescription: '抽屉内容' } },
    setting: {
      title: '设置',
      openMenu: '打开菜单',
      generalSetting: '通用设置',
      keyManagement: { title: '密钥管理' },
      toastTest: 'Toast 测试',
    },
  }));

import SettingPage from '@/pages/Setting/index.vue';
import SettingHeader from '@/pages/Setting/components/SettingHeader.vue';
import { useSettingPageStore } from '@/store/pinia/settingPage';

describe('SettingPage（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    mockPush.mockClear();
    Object.assign(mockResponsive, { isMobile: false, isDesktop: true });
    mockRoute.path = '/setting';
  });

  describe('桌面端布局', () => {
    it('渲染固定侧边栏与内容区', () => {
      render(SettingPage);

      // 侧边栏 wrapper（aside）与导航
      expect(screen.getByRole('navigation', { name: '设置导航' })).toBeVisible();
      // 内容区嵌套路由挂载点
      expect(screen.getByTestId('setting-content')).toBeVisible();
      // 侧边栏按钮真实渲染
      expect(screen.getByRole('button', { name: '通用设置' })).toBeVisible();
    });

    it('桌面端不渲染移动端菜单按钮', () => {
      render(SettingPage);

      expect(screen.queryByRole('button', { name: '打开菜单' })).not.toBeInTheDocument();
    });
  });

  describe('SettingSidebar 导航', () => {
    it('点击设置按钮时跳转对应路径', async () => {
      render(SettingPage);

      await fireEvent.click(screen.getByRole('button', { name: '通用设置' }));

      expect(mockPush).toHaveBeenCalledWith('common');
    });

    it('点击已选中按钮时不触发跳转（防重复点击）', async () => {
      mockRoute.path = '/setting/common';
      render(SettingPage);

      await fireEvent.click(screen.getByRole('button', { name: '通用设置' }));

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('非桌面端按钮使用压缩样式', () => {
      Object.assign(mockResponsive, { isMobile: true, isDesktop: false });
      render(SettingPage);

      const buttons = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('aria-label') !== '打开菜单',
      );
      for (const btn of buttons) {
        expect(btn.className).toContain('h-9');
        expect(btn.className).toContain('text-sm');
      }
    });

    it('开发环境渲染 Toast 测试入口', () => {
      render(SettingPage);

      expect(screen.getByRole('button', { name: 'Toast 测试' })).toBeVisible();
    });
  });

  describe('移动端抽屉', () => {
    it('移动端渲染 Header 菜单按钮与主内容 padding', () => {
      Object.assign(mockResponsive, { isMobile: true, isDesktop: false });
      render(SettingPage);

      expect(screen.getByRole('button', { name: '打开菜单' })).toBeVisible();
      expect(screen.getByTestId('setting-content').className).toContain('pt-12');
    });

    it('点击菜单按钮切换抽屉开关状态', async () => {
      Object.assign(mockResponsive, { isMobile: true, isDesktop: false });
      render(SettingPage);
      const store = useSettingPageStore();
      expect(store.isDrawerOpen).toBe(false);

      await fireEvent.click(screen.getByRole('button', { name: '打开菜单' }));

      expect(store.isDrawerOpen).toBe(true);
    });
  });
});

describe('SettingHeader（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.assign(mockResponsive, { isMobile: false, isDesktop: true });
  });

  it('移动端渲染菜单按钮，桌面端不渲染', () => {
    Object.assign(mockResponsive, { isMobile: true, isDesktop: false });
    const mobile = render(SettingHeader);
    expect(screen.getByRole('button', { name: '打开菜单' })).toBeVisible();
    mobile.unmount();

    Object.assign(mockResponsive, { isMobile: false, isDesktop: true });
    render(SettingHeader);
    expect(screen.queryByRole('button', { name: '打开菜单' })).not.toBeInTheDocument();
  });
});

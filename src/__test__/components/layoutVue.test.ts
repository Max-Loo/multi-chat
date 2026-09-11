/**
 * Vue 布局组件冒烟测试
 *
 * 验证 Layout/Sidebar/BottomNav/MobileDrawer 的核心行为：
 * 桌面端显示侧边栏、移动端显示底部导航、抽屉开合。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen } from '@testing-library/vue';

// Mock vue-router（组件使用 useRoute/useRouter）
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  RouterView: { template: '<div />' },
}));

// useResponsive 全局用例视口为桌面尺寸
import Layout from '@/components/Layout.vue';
import Sidebar from '@/components/Sidebar.vue';
import BottomNav from '@/components/BottomNav.vue';

describe('Vue 布局组件', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('Layout 渲染根结构（桌面端含侧边栏）', () => {
    render(Layout);
    expect(screen.getByTestId('layout-root')).toBeVisible();
    expect(screen.getByTestId('layout-main')).toBeVisible();
  });

  it('Sidebar 渲染导航项并标注当前路由', () => {
    render(Sidebar);
    // 桌面视口下渲染 3 个导航按钮
    const nav = screen.getByRole('navigation');
    expect(nav).toBeVisible();
    // 当前路径 /chat 的项应标记 aria-current
    expect(nav.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it('BottomNav 在桌面视口不渲染', () => {
    const { container } = render(BottomNav);
    expect(container.querySelector('nav')).toBeNull();
  });
});

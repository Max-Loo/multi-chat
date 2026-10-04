/**
 * Layout 组件测试
 *
 * 验证桌面/移动端布局结构（侧边栏、主内容区、底部导航）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/vue';
import { Layout } from '@/components/Layout';

const responsiveMock = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => responsiveMock,
}));

vi.mock('vue-router', () => ({
  RouterView: { template: '<div data-testid="router-view-stub" />' },
}));

vi.mock('@/components/Sidebar', () => ({
  Sidebar: { template: '<nav data-testid="sidebar-stub">sidebar</nav>' },
}));

vi.mock('@/components/BottomNav', () => ({
  BottomNav: { template: '<nav data-testid="bottom-nav-stub">bottom</nav>' },
}));

vi.mock('@/components/Skeleton', () => ({
  PageSkeleton: { template: '<div data-testid="page-skeleton-stub" />' },
}));

describe('Layout 组件', () => {
  beforeEach(() => {
    responsiveMock.isMobile = false;
  });

  it('应该渲染 Layout 组件并包含主内容区域', () => {
    const { container } = render(Layout);

    expect(container.querySelector('[data-testid="layout-root"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="layout-main"]'),
    ).toBeInTheDocument();
  });

  it('桌面端应有 Sidebar 和主内容区域且不显示底部导航', () => {
    const { container } = render(Layout);

    expect(container.querySelector('[data-testid="sidebar-stub"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="bottom-nav-stub"]')).toBeNull();
  });

  it('移动端应显示底部导航且不显示侧边栏，主内容区留出底部空间', () => {
    responsiveMock.isMobile = true;

    const { container } = render(Layout);

    expect(container.querySelector('[data-testid="bottom-nav-stub"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="sidebar-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="layout-main"]')?.className).toContain(
      'pb-16',
    );
  });

  it('主内容区域应该有 main 角色', () => {
    const { container } = render(Layout);

    expect(
      container.querySelector('[role="main"][data-testid="layout-main"]'),
    ).toBeInTheDocument();
  });
});

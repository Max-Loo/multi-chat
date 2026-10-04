/**
 * 响应式布局模式切换集成测试（Vue 版）
 *
 * 测试目标：验证不同布局模式下 Layout 的组件渲染差异
 * - Desktop：渲染 Sidebar，无底部导航
 * - Mobile：无 Sidebar，渲染底部导航
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { Layout } from '@/components/Layout';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: { a11y: { mainNav: '主导航', bottomNav: '底部导航' } },
    }).useTranslation(),
}));

// 响应式状态 mock（可变对象）
const mockResponsive = vi.hoisted(() => ({
  isMobile: false,
  isDesktop: true,
}));

vi.mock('@/composables/useResponsive', async () => {
  const { computed } = await import('vue');
  return {
    useResponsive: () => ({
      isMobile: computed(() => mockResponsive.isMobile),
      isDesktop: computed(() => mockResponsive.isDesktop),
      layoutMode: computed(() => (mockResponsive.isMobile ? 'mobile' : 'desktop')),
    }),
  };
});

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

/** 设置响应式模式 */
function setResponsiveMode(mode: 'desktop' | 'mobile') {
  mockResponsive.isMobile = mode === 'mobile';
  mockResponsive.isDesktop = mode === 'desktop';
}

describe('响应式布局模式切换集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setResponsiveMode('desktop');
  });

  it('Desktop 模式应该渲染 Sidebar 且无底部导航', () => {
    setResponsiveMode('desktop');
    const { container } = render(Layout);

    const layoutRoot = container.querySelector('[data-testid="layout-root"]')!;
    const main = screen.getByTestId('layout-main');
    // Sidebar 在 main 之前
    expect(Array.from(layoutRoot.children).indexOf(main)).toBeGreaterThan(0);
    expect(container.querySelector('[data-testid="bottom-nav-stub"]')).toBeNull();
  });

  it('Mobile 模式应该渲染底部导航且无 Sidebar', () => {
    setResponsiveMode('mobile');
    const { container } = render(Layout);

    const layoutRoot = container.querySelector('[data-testid="layout-root"]')!;
    const main = screen.getByTestId('layout-main');
    expect(layoutRoot.children[0]).toBe(main);
    expect(container.querySelector('[data-testid="bottom-nav-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="sidebar-stub"]')).toBeNull();
  });

  it('模式切换后布局结构不同', async () => {
    setResponsiveMode('desktop');
    const { unmount } = render(Layout);
    expect(screen.queryByTestId('bottom-nav-stub')).toBeNull();
    unmount();

    setResponsiveMode('mobile');
    render(Layout);
    await nextTick();
    expect(screen.queryByTestId('bottom-nav-stub')).not.toBeNull();
  });
});

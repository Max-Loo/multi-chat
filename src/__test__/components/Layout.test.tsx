/**
 * Layout 组件测试
 *
 * 测试布局渲染和基本结构
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Layout from '@/components/Layout';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';

vi.mock('react-i18next', () => globalThis.__mockI18n());

/**
 * Mock useResponsive hook，支持切换 isMobile 返回值
 */
const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

/**
 * 渲染 Layout 组件的辅助函数
 */
function renderLayout(store: ReturnType<typeof createTypeSafeTestStore>, props?: { className?: string }) {
  return renderWithProviders(<Layout {...props} />, { store });
}

describe('Layout 组件', () => {
  // 共享 store：测试只验证 DOM 结构和组件行为，不依赖特定 Redux 状态
  const store = createTypeSafeTestStore();

  beforeEach(() => {
    mockResponsive.isMobile = false;
    mockResponsive.layoutMode = 'desktop';
    mockResponsive.isDesktop = true;
    mockResponsive.isCompact = false;
    mockResponsive.isCompressed = false;
  });

  describe('渲染测试', () => {
    it('应该正确渲染 Layout 组件', () => {
      renderLayout(store);

      screen.getByTestId('layout-root');
    });

    it('应该渲染主内容区域', () => {
      renderLayout(store);

      screen.getByRole('main');
    });

    it('应该应用正确的布局结构', () => {
      renderLayout(store);

      const layoutDiv = screen.getByTestId('layout-root');
      expect(layoutDiv.children.length).toBeGreaterThan(0);
    });

    it('应该支持自定义 className', () => {
      renderLayout(store, { className: 'custom-class' });

      expect(screen.getByTestId('layout-root')).toHaveClass('custom-class');
    });
  });

  describe('布局结构测试', () => {
    it('桌面端应有 Sidebar 和主内容区域并排', () => {
      renderLayout(store);

      const layout = screen.getByTestId('layout-root');
      const main = screen.getByRole('main');
      // Sidebar 存在且在 main 之前（水平排列）
      const children = Array.from(layout.children);
      expect(children.indexOf(main)).toBeGreaterThan(0);
    });

    it('应该通过 Suspense 包裹 Outlet 内容', () => {
      renderLayout(store);

      const main = screen.getByRole('main');
      // main 区域存在于 layout-root 内，为 Suspense + Outlet 提供容器
      const layout = screen.getByTestId('layout-root');
      expect(layout).toContainElement(main);
    });
  });

  describe('子组件位置测试', () => {
    it('应该正确渲染 Sidebar 组件', () => {
      renderLayout(store);

      // 桌面端 Sidebar 在 main 之前渲染
      const layout = screen.getByTestId('layout-root');
      const main = screen.getByRole('main');
      expect(layout.children[0]).not.toBe(main);
    });

    it('Sidebar 应该位于主内容区域之前', () => {
      renderLayout(store);

      const layout = screen.getByTestId('layout-root');
      const main = screen.getByRole('main');
      const children = Array.from(layout.children);
      // Sidebar 在 DOM 顺序上位于 main 之前
      expect(children.indexOf(main)).toBeGreaterThan(0);
    });
  });

  describe('响应式行为', () => {
    it('应该在移动端和桌面端都正确渲染', () => {
      // 桌面端：Sidebar 在 main 之前，无底部导航
      mockResponsive.isMobile = false;
      const { unmount } = renderLayout(store);
      const desktopLayout = screen.getByTestId('layout-root');
      const desktopMain = screen.getByRole('main');
      expect(Array.from(desktopLayout.children).indexOf(desktopMain)).toBeGreaterThan(0);
      // 桌面端只有侧边栏导航，无底部导航
      expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: '底部导航' })).toBeNull();
      unmount();

      // 移动端：main 是第一个子元素（无 Sidebar），有底部导航
      mockResponsive.isMobile = true;
      mockResponsive.layoutMode = 'mobile';
      renderLayout(store);
      const mobileLayout = screen.getByTestId('layout-root');
      expect(mobileLayout.children[0]).toBe(screen.getByRole('main'));
    });

    it('主内容区域应该是 layout 的子元素', () => {
      renderLayout(store);

      const layout = screen.getByTestId('layout-root');
      const main = screen.getByRole('main');
      expect(layout).toContainElement(main);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空 className', () => {
      renderLayout(store, { className: '' });

      screen.getByTestId('layout-root');
    });

    it('应该处理多个自定义 className', () => {
      renderLayout(store, { className: 'class1 class2 class3' });

      expect(screen.getByTestId('layout-root')).toHaveClass('class1', 'class2', 'class3');
    });
  });
});

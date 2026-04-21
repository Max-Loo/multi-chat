/**
 * Layout 组件测试
 *
 * 测试布局渲染和基本结构
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import Layout from '@/components/Layout';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import type { LayoutMode } from '@/hooks/useResponsive';

vi.mock('react-i18next', () => {
  const R = {};
  return globalThis.__createI18nMockReturn(R);
});

/**
 * Mock useResponsive hook，支持切换 isMobile 返回值
 */
const mockResponsive = vi.hoisted(() => ({
  layoutMode: 'desktop' as LayoutMode,
  isMobile: false,
  isCompact: false,
  isCompressed: false,
  isDesktop: true,
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

/**
 * 渲染 Layout 组件的辅助函数
 */
function renderLayout(store: ReturnType<typeof createTypeSafeTestStore>, props?: { className?: string }) {
  return render(
    <Provider store={store}>
        <BrowserRouter>
          <Layout {...props} />
        </BrowserRouter>
    </Provider>
  );
}

describe('Layout 组件', () => {
  beforeEach(() => {
    mockResponsive.isMobile = false;
    mockResponsive.layoutMode = 'desktop';
    mockResponsive.isDesktop = true;
    mockResponsive.isCompact = false;
    mockResponsive.isCompressed = false;
  });

  describe('渲染测试', () => {
    it('应该正确渲染 Layout 组件', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('应该渲染主内容区域', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('应该应用正确的布局结构', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      const layoutDiv = screen.getByTestId('layout');
      expect(layoutDiv).toBeInTheDocument();
      expect(layoutDiv.children.length).toBeGreaterThan(0);
    });

    it('应该支持自定义 className', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store, { className: 'custom-class' });

      expect(screen.getByTestId('layout')).toHaveClass('custom-class');
    });
  });

  describe('布局结构测试', () => {
    it('应该有正确的 Flexbox 布局结构', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toHaveClass('flex');
    });

    it('应该占满整个屏幕高度', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toHaveClass('h-screen');
    });

    it('主内容区域应该占据剩余空间', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Suspense 处理测试', () => {
    it('应该使用 Suspense 包裹 Outlet', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      // 验证 main 区域有 overflow-y-hidden，为 Suspense+Outlet 提供滚动容器
      const main = screen.getByRole('main');
      expect(main).toHaveClass('overflow-y-hidden');
    });
  });

  describe('子组件位置测试', () => {
    it('应该正确渲染 Sidebar 组件', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      // 桌面端 Sidebar 在 main 之前渲染
      const layout = screen.getByTestId('layout');
      const main = screen.getByRole('main');
      expect(layout.children[0]).not.toBe(main);
    });

    it('Sidebar 应该位于主内容区域之前', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      const layout = screen.getByTestId('layout');
      const main = screen.getByRole('main');
      const children = Array.from(layout.children);
      // Sidebar 在 DOM 顺序上位于 main 之前
      expect(children.indexOf(main)).toBeGreaterThan(0);
    });
  });

  describe('响应式行为', () => {
    it('应该在移动端和桌面端都正确渲染', () => {
      const store = createTypeSafeTestStore();

      // 桌面端：无 flex-col，Sidebar 在 main 之前
      mockResponsive.isMobile = false;
      const { unmount } = renderLayout(store);
      expect(screen.getByTestId('layout')).not.toHaveClass('flex-col');
      unmount();

      // 移动端：有 flex-col，main 是第一个子元素（无 Sidebar）
      mockResponsive.isMobile = true;
      mockResponsive.layoutMode = 'mobile';
      renderLayout(store);
      expect(screen.getByTestId('layout')).toHaveClass('flex-col');
      const layout = screen.getByTestId('layout');
      const main = screen.getByRole('main');
      expect(layout.children[0]).toBe(main);
    });

    it('应该保持固定高度布局不受视口影响', () => {
      const store = createTypeSafeTestStore();

      // 桌面端
      mockResponsive.isMobile = false;
      const { unmount } = renderLayout(store);
      expect(screen.getByTestId('layout')).toHaveClass('h-screen');
      unmount();

      // 移动端
      mockResponsive.isMobile = true;
      renderLayout(store);
      expect(screen.getByTestId('layout')).toHaveClass('h-screen');
    });

    it('主内容区域应该占满父容器高度', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByRole('main')).toHaveClass('flex-1');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空 className', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store, { className: '' });

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('应该处理多个自定义 className', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store, { className: 'class1 class2 class3' });

      expect(screen.getByTestId('layout')).toHaveClass('class1', 'class2', 'class3');
    });
  });
});

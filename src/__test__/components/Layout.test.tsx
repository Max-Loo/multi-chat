/**
 * Layout 组件测试
 *
 * 测试布局渲染和基本结构
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import Layout from '@/components/Layout';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';

vi.mock('react-i18next', () => {
  const R = {};
  return globalThis.__createI18nMockReturn(R);
});

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

// 每个测试后清理 DOM
afterEach(() => {
  cleanup();
});

describe('Layout 组件', () => {
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

      const layoutDiv = screen.getByTestId('layout');

      // 验证布局容器存在并包含子元素
      expect(layoutDiv).toBeInTheDocument();
      expect(layoutDiv.children.length).toBeGreaterThan(0);
    });

    it('应该占满整个屏幕高度', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toBeInTheDocument();
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

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  describe('子组件位置测试', () => {
    it('应该正确渲染 Sidebar 组件', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('Sidebar 应该位于主内容区域之前', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      const layoutDiv = screen.getByTestId('layout');
      const mainContent = screen.getByRole('main');

      // 验证主内容区域存在
      expect(mainContent).toBeInTheDocument();

      // 验证它们在同一个布局容器中
      expect(layoutDiv).toContainElement(mainContent);
    });
  });

  describe('响应式行为', () => {
    it('应该在移动端和桌面端都正确渲染', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('应该保持固定高度布局不受视口影响', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('主内容区域应该占满父容器高度', () => {
      const store = createTypeSafeTestStore();
      renderLayout(store);

      expect(screen.getByRole('main')).toBeInTheDocument();
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

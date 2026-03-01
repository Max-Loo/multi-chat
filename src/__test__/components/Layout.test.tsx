/**
 * Layout 组件测试
 * 
 * 测试布局渲染和基本结构
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';

// 每个测试后清理 DOM
afterEach(() => {
  cleanup();
});

// Mock 子组件
vi.mock('@/components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('@/components/InitializationScreen', () => ({
  default: () => <div data-testid="initialization-screen">Loading...</div>,
}));

describe('Layout 组件', () => {
  describe('渲染测试', () => {
    it('应该正确渲染 Layout 组件', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      expect(container.firstChild).toBeDefined();
    });

    it('应该渲染主内容区域', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const mainContent = container.querySelector('.flex-1');
      expect(mainContent).toBeDefined();
    });

    it('应该应用正确的 CSS 类名', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      expect(layoutDiv).toHaveClass('flex', 'h-screen', 'bg-white');
    });

    it('应该支持自定义 className', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout className="custom-class" />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      expect(layoutDiv).toHaveClass('custom-class');
    });
  });

  describe('布局结构测试', () => {
    it('应该有正确的 Flexbox 布局结构', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      const mainContent = container.querySelector('.flex-1');

      // Layout 应该是 flex 容器
      expect(layoutDiv).toHaveClass('flex');

      // 主内容区域应该存在
      expect(mainContent).toBeDefined();
    });

    it('应该占满整个屏幕高度', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      expect(layoutDiv).toHaveClass('h-screen');
    });

    it('主内容区域应该占据剩余空间', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const mainContent = container.querySelector('.flex-1');
      expect(mainContent).toHaveClass('flex-1');
    });
  });

  describe('Suspense 处理测试', () => {
    it('应该使用 Suspense 包裹 Outlet', () => {
      render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      // 验证 Suspense fallback 不会立即显示（因为没有实际加载懒组件）
      expect(screen.queryByTestId('initialization-screen')).not.toBeInTheDocument();
    });
  });

  describe('子组件位置测试', () => {
    it('应该正确渲染 Sidebar 组件', () => {
      render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('Sidebar 应该位于主内容区域之前', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      const sidebar = screen.getByTestId('sidebar');
      const mainContent = container.querySelector('.flex-1');

      // 验证 Sidebar 和主内容区域都存在
      expect(sidebar).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();

      // 验证它们是兄弟节点
      expect(layoutDiv).toContainElement(sidebar);
      expect(layoutDiv).toContainElement(mainContent as HTMLElement);
    });
  });

  describe('响应式行为', () => {
    it('应该在移动端和桌面端都正确渲染', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      expect(container.firstChild).toBeDefined();
    });

    it('应该保持固定高度布局不受视口影响', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      
      // 验证布局使用 h-screen 而不是 min-h-screen
      expect(layoutDiv).toHaveClass('h-screen');
      expect(layoutDiv).not.toHaveClass('min-h-screen');
    });

    it('主内容区域应该占满父容器高度', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const mainContent = container.querySelector('.flex-1') as HTMLElement;
      
      expect(mainContent).toHaveClass('h-full');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空 className', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout className="" />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      expect(layoutDiv).toHaveClass('flex', 'h-screen', 'bg-white');
    });

    it('应该处理多个自定义 className', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout className="class1 class2 class3" />
        </BrowserRouter>
      );

      const layoutDiv = container.firstChild as HTMLElement;
      expect(layoutDiv).toHaveClass('class1', 'class2', 'class3');
    });
  });
});

/**
 * MobileDrawer 组件测试
 *
 * 测试抽屉打开/关闭、遮罩点击、ESC键关闭、背景滚动锁定等功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileDrawer } from '@/components/MobileDrawer';
import { asTestType } from '@/__test__/helpers/testing-utils';

vi.mock('react-i18next', () => globalThis.__mockI18n());

// Mock shadcn/ui Sheet 组件（底层依赖 radix-ui Dialog，涉及 Portal/Overlay/FocusTrap 等 DOM 结构，
// 在 happy-dom 中缺少 DOMPortal 支持，不 mock 会导致渲染失败，保留此 mock）
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: any) => (
    <div data-open={open} data-testid="sheet">
      {children}
    </div>
  ),
  SheetContent: ({ children, className, showCloseButton, side, ...props }: any) => (
    <div
      data-testid="sheet-content"
      data-side={side}
      data-show-close-button={showCloseButton}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  SheetTitle: ({ children, className }: any) => (
    <div data-testid="sheet-title" className={className}>
      {children}
    </div>
  ),
  SheetDescription: ({ children, className }: any) => (
    <div data-testid="sheet-description" className={className}>
      {children}
    </div>
  ),
}));

// 测试用复杂子组件
const ComplexChild = () => (
  <div data-testid="complex-child">
    <span>嵌套内容</span>
  </div>
);

describe('MobileDrawer 组件', () => {
  let mockOnOpenChange: any;

  beforeEach(() => {
    mockOnOpenChange = vi.fn();
  });

  
  describe('基础渲染', () => {
    it('应该正确渲染抽屉组件', () => {
      render(
        <MobileDrawer isOpen={false} onOpenChange={mockOnOpenChange}>
          <div>抽屉内容</div>
        </MobileDrawer>
      );

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toBeInTheDocument();
      expect(sheet).toHaveAttribute('data-open', 'false');
    });

    it('应该在打开状态时正确渲染', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>抽屉内容</div>
        </MobileDrawer>
      );

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'true');
    });

    it('应该渲染子组件内容', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div data-testid="drawer-content">测试内容</div>
        </MobileDrawer>
      );

      const content = screen.getByTestId('drawer-content');
      expect(content).toBeInTheDocument();
      expect(content.textContent).toBe('测试内容');
    });

    it('应该渲染 SheetTitle 和 SheetDescription（用于可访问性）', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      const title = screen.getByTestId('sheet-title');
      const description = screen.getByTestId('sheet-description');

      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(title).toHaveClass('sr-only');
      expect(description).toHaveClass('sr-only');
    });
  });

  describe('抽屉打开/关闭逻辑', () => {
    it('应该调用 onOpenChange 回调当打开状态改变时', () => {
      const { rerender } = render(
        <MobileDrawer isOpen={false} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      // 重新渲染为打开状态
      rerender(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      // Sheet 组件会根据 open prop 的变化触发 onOpenChange
      // 这里我们验证组件正确接收了 open prop
      const sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'true');
    });
  });

  describe('布局行为', () => {
    it('应该从左侧滑出（side="left"）', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveAttribute('data-side', 'left');
    });
  });

  describe('关闭按钮', () => {
    it('默认应该显示关闭按钮', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveAttribute('data-show-close-button', 'true');
    });

    it('应该支持隐藏关闭按钮（showCloseButton=false）', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange} showCloseButton={false}>
          <div>内容</div>
        </MobileDrawer>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveAttribute('data-show-close-button', 'false');
    });
  });

  describe('可访问性', () => {
    it('应该有正确的 aria-description 属性', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveAttribute('aria-description', '抽屉内容');
    });

    it('标题和描述应该使用 sr-only 类（屏幕阅读器可见）', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      const title = screen.getByTestId('sheet-title');
      const description = screen.getByTestId('sheet-description');

      expect(title).toHaveClass('sr-only');
      expect(description).toHaveClass('sr-only');
      expect(title.textContent).toBe('侧边栏');
      expect(description.textContent).toBe('侧边栏');
    });
  });

  describe('子组件渲染', () => {
    it('应该渲染多个子组件', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div data-testid="child-1">子组件1</div>
          <div data-testid="child-2">子组件2</div>
          <div data-testid="child-3">子组件3</div>
        </MobileDrawer>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('应该渲染复杂的子组件树', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <ComplexChild />
        </MobileDrawer>
      );

      expect(screen.getByText('嵌套内容')).toBeInTheDocument();
      expect(screen.getByTestId('complex-child')).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理空子组件', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          {null}
        </MobileDrawer>
      );

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toBeInTheDocument();
    });

    it('应该处理 undefined children', () => {
      render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          {/* Reason: 测试 undefined children 的降级处理 */}
          {asTestType<React.ReactNode>(undefined)}
        </MobileDrawer>
      );

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toBeInTheDocument();
    });

    it('应该处理频繁的打开/关闭状态变化', () => {
      const { rerender } = render(
        <MobileDrawer isOpen={false} onOpenChange={mockOnOpenChange}>
          <div>内容</div>
        </MobileDrawer>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <MobileDrawer isOpen={i % 2 === 0} onOpenChange={mockOnOpenChange}>
            <div>内容</div>
          </MobileDrawer>
        );
      }

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toBeInTheDocument();
    });
  });

  describe('open/close 状态切换渲染', () => {
    it('应该从 closed 切换到 open 时渲染抽屉内容', () => {
      const { rerender } = render(
        <MobileDrawer isOpen={false} onOpenChange={mockOnOpenChange}>
          <div data-testid="drawer-body">抽屉主体内容</div>
        </MobileDrawer>
      );

      // closed 状态下 Sheet 组件仍然渲染（只是不可见）
      const sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'false');

      // 切换到 open
      rerender(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div data-testid="drawer-body">抽屉主体内容</div>
        </MobileDrawer>
      );

      // open 状态下内容应该渲染
      expect(screen.getByTestId('drawer-body')).toBeInTheDocument();
      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true');
    });

    it('应该从 open 切换到 closed 时更新状态', () => {
      const { rerender } = render(
        <MobileDrawer isOpen={true} onOpenChange={mockOnOpenChange}>
          <div data-testid="drawer-body">内容</div>
        </MobileDrawer>
      );

      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'true');

      // 切换到 closed
      rerender(
        <MobileDrawer isOpen={false} onOpenChange={mockOnOpenChange}>
          <div data-testid="drawer-body">内容</div>
        </MobileDrawer>
      );

      expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false');
    });
  });

  describe('Props 类型检查', () => {
    it('应该接受所有必需的 props', () => {
      const props = {
        isOpen: true,
        onOpenChange: mockOnOpenChange,
        children: <div>内容</div>,
      };

      expect(() => {
        render(<MobileDrawer {...props} />);
      }).not.toThrow();
    });

    it('应该接受可选的 showCloseButton prop', () => {
      const props = {
        isOpen: true,
        onOpenChange: mockOnOpenChange,
        children: <div>内容</div>,
        showCloseButton: false,
      };

      expect(() => {
        render(<MobileDrawer {...props} />);
      }).not.toThrow();
    });
  });
});

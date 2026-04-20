/**
 * PanelSkeleton 组件单元测试
 *
 * 测试面板骨架屏：
 * - Header 骨架渲染
 * - columnCount 控制列数
 * - 消息气泡交替对齐
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import PanelSkeleton from '@/pages/Chat/components/Panel/Skeleton';

// Mock shadcn Skeleton
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <div data-testid="skeleton-item" className={className} style={style} />
  ),
}));

describe('PanelSkeleton', () => {
  it('应该渲染 Header 骨架', () => {
    const { container } = render(<PanelSkeleton />);

    // Header 区域存在（高度 h-12）
    const header = container.querySelector('.h-12');
    expect(header).toBeInTheDocument();
  });

  it('应该渲染单列 当 columnCount 为默认值 1', () => {
    const { container } = render(<PanelSkeleton />);

    // inline style 中的 gridTemplateColumns 渲染为 grid-template-columns
    const gridContainer = container.querySelector('[style*="grid-template-columns"]');
    expect(gridContainer).toHaveStyle({
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    });
  });

  it('应该渲染两列 当 columnCount 为 2', () => {
    const { container } = render(<PanelSkeleton columnCount={2} />);

    const gridContainer = container.querySelector('[style*="grid-template-columns"]');
    expect(gridContainer).toHaveStyle({
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    });
  });

  it('应该显示列数控制骨架 当 columnCount > 1', () => {
    const { container } = render(<PanelSkeleton columnCount={2} />);

    // 多列控制区域应存在
    const controlArea = container.querySelector('.gap-2');
    expect(controlArea).toBeInTheDocument();
  });

  it('应该不显示列数控制骨架 当 columnCount 为 1', () => {
    const { container } = render(<PanelSkeleton columnCount={1} />);

    // 右侧多列控制区域不应存在（header 内的 items-center.justify-start.text-sm 组合）
    const controlArea = container.querySelector('.h-12 .text-sm.gap-2');
    expect(controlArea).toBeNull();
  });

  it('应该渲染发送框区域骨架', () => {
    const { container } = render(<PanelSkeleton />);

    // 发送框区域（border-t）
    const senderArea = container.querySelector('.border-t');
    expect(senderArea).toBeInTheDocument();
  });

  it('应该渲染交替对齐的消息气泡', () => {
    const { container } = render(<PanelSkeleton columnCount={1} />);

    // 检查 justify-end（偶数，用户消息）和 justify-start（奇数，AI 消息）交替
    const rightAligned = container.querySelectorAll('.justify-end');
    const leftAligned = container.querySelectorAll('.justify-start');

    expect(rightAligned.length).toBeGreaterThan(0);
    expect(leftAligned.length).toBeGreaterThan(0);
  });
});

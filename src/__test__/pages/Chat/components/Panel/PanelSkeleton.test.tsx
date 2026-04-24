/**
 * PanelSkeleton 组件单元测试
 *
 * 测试面板骨架屏：
 * - Header 骨架渲染
 * - columnCount 控制列数
 * - 消息气泡交替对齐
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PanelSkeleton from '@/pages/Chat/components/Panel/Skeleton';

describe('PanelSkeleton', () => {
  it('应该渲染 Header 骨架', () => {
    render(<PanelSkeleton />);

    const header = screen.getByTestId('skeleton-header');
    expect(header).toBeInTheDocument();
  });

  it('应该渲染单列 当 columnCount 为默认值 1', () => {
    render(<PanelSkeleton />);

    const gridContainer = screen.getByTestId('skeleton-message-grid');
    expect(gridContainer).toHaveStyle({
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    });
  });

  it('应该渲染两列 当 columnCount 为 2', () => {
    render(<PanelSkeleton columnCount={2} />);

    const gridContainer = screen.getByTestId('skeleton-message-grid');
    expect(gridContainer).toHaveStyle({
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    });
  });

  it('应该显示列数控制骨架 当 columnCount > 1', () => {
    render(<PanelSkeleton columnCount={2} />);

    const controlArea = screen.getByTestId('skeleton-column-control');
    expect(controlArea).toBeInTheDocument();
  });

  it('应该不显示列数控制骨架 当 columnCount 为 1', () => {
    render(<PanelSkeleton columnCount={1} />);

    expect(screen.queryByTestId('skeleton-column-control')).not.toBeInTheDocument();
  });

  it('应该渲染发送框区域骨架', () => {
    render(<PanelSkeleton />);

    const senderArea = screen.getByTestId('skeleton-sender');
    expect(senderArea).toBeInTheDocument();
  });

  it('应该渲染交替对齐的消息气泡', () => {
    render(<PanelSkeleton columnCount={1} />);

    const rightAligned = screen.getAllByTestId('skeleton-bubble-right');
    const leftAligned = screen.getAllByTestId('skeleton-bubble-left');

    expect(rightAligned.length).toBeGreaterThan(0);
    expect(leftAligned.length).toBeGreaterThan(0);
  });
});

/**
 * PanelSkeleton 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/Panel/PanelSkeleton.test.tsx，
 * 保留核心语义：
 * - 头部骨架渲染
 * - 列数控制骨架按 columnCount 显隐
 * - 消息气泡骨架按列渲染且左右交替
 * - 发送框区域骨架渲染
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';

import PanelSkeleton from '@/pages/Chat/components/Panel/Skeleton.vue';

describe('PanelSkeleton（Vue 版）', () => {
  it('应该渲染头部骨架', () => {
    render(PanelSkeleton);

    expect(screen.getByTestId('skeleton-header')).toBeInTheDocument();
  });

  it('应该渲染单列结构 当 columnCount 为默认值 1', () => {
    render(PanelSkeleton);

    const grid = screen.getByTestId('skeleton-message-grid');
    expect(grid.style.gridTemplateColumns).toContain('1');
    expect(
      screen.queryByTestId('skeleton-column-control'),
    ).not.toBeInTheDocument();
  });

  it('应该渲染两列 当 columnCount 为 2', () => {
    render(PanelSkeleton, { props: { columnCount: 2 } });

    const grid = screen.getByTestId('skeleton-message-grid');
    expect(grid.style.gridTemplateColumns).toContain('2');
    expect(screen.getByTestId('skeleton-column-control')).toBeInTheDocument();
  });

  it('应该按列渲染左右交替的消息气泡骨架', () => {
    render(PanelSkeleton, { props: { columnCount: 2 } });

    // 每列 3 行气泡：左、右、左
    expect(screen.getAllByTestId('skeleton-bubble-left')).toHaveLength(4);
    expect(screen.getAllByTestId('skeleton-bubble-right')).toHaveLength(2);
  });

  it('应该渲染发送框区域骨架', () => {
    render(PanelSkeleton);

    expect(screen.getByTestId('skeleton-sender')).toBeInTheDocument();
  });
});

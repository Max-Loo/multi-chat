/**
 * Vue PanelSkeleton 组件测试
 *
 * 对应 React 版 PanelSkeleton.test.tsx 的行为断言：
 * 骨架屏分区（头部/消息网格/发送框）、列数驱动的网格模板与列数控制骨架、交替气泡。
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';

import PanelSkeleton from '@/pages/Chat/components/Panel/PanelSkeleton.vue';

describe('PanelSkeleton（Vue 版）', () => {
  it('渲染头部与发送框骨架', () => {
    render(PanelSkeleton);

    expect(screen.getByTestId('skeleton-header')).toBeTruthy();
    expect(screen.getByTestId('skeleton-sender')).toBeTruthy();
  });

  it('默认渲染单列消息网格', () => {
    render(PanelSkeleton);

    const grid = screen.getByTestId('skeleton-message-grid');
    expect(grid.getAttribute('style')).toContain('repeat(1, minmax(0, 1fr))');
  });

  it('columnCount 为 2 时渲染两列网格', () => {
    render(PanelSkeleton, { props: { columnCount: 2 } });

    const grid = screen.getByTestId('skeleton-message-grid');
    expect(grid.getAttribute('style')).toContain('repeat(2, minmax(0, 1fr))');
  });

  it('columnCount 大于 1 时显示列数控制骨架', () => {
    render(PanelSkeleton, { props: { columnCount: 2 } });

    expect(screen.getByTestId('skeleton-column-control')).toBeTruthy();
  });

  it('columnCount 为 1 时不显示列数控制骨架', () => {
    render(PanelSkeleton, { props: { columnCount: 1 } });

    expect(screen.queryByTestId('skeleton-column-control')).toBeNull();
  });

  it('渲染交替对齐的消息气泡骨架', () => {
    render(PanelSkeleton, { props: { columnCount: 2 } });

    expect(screen.getAllByTestId('skeleton-bubble-right').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('skeleton-bubble-left').length).toBeGreaterThan(0);
  });
});

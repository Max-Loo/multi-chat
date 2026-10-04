/**
 * MasonryGrid 瀑布流组件测试
 *
 * 验证断点列数计算（与 react-masonry-css 的 breakpointCols 语义一致）
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/vue';
import MasonryGrid from '@/components/ui/masonry/MasonryGrid.vue';

describe('MasonryGrid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('应该使用 default 列数', () => {
    vi.stubGlobal('innerWidth', 800);

    const { container } = render(MasonryGrid, {
      props: {
        breakpointCols: { default: 3, 1024: 1, 1560: 2 },
      },
    });

    const grid = container.querySelector('[data-testid="masonry-grid"]') as HTMLElement;
    expect(grid.style.columnCount).toBe('3');
  });

  it('视口达到断点时应该切换列数', () => {
    vi.stubGlobal('innerWidth', 1200);

    const { container } = render(MasonryGrid, {
      props: {
        breakpointCols: { default: 3, 1024: 1, 1560: 2 },
      },
    });

    const grid = container.querySelector('[data-testid="masonry-grid"]') as HTMLElement;
    // 1200 ≥ 1024 且 < 1560 → 1 列
    expect(grid.style.columnCount).toBe('1');
  });

  it('视口达到更高断点时应该取该断点列数', () => {
    vi.stubGlobal('innerWidth', 1920);

    const { container } = render(MasonryGrid, {
      props: {
        breakpointCols: { default: 3, 1024: 1, 1560: 2 },
      },
    });

    const grid = container.querySelector('[data-testid="masonry-grid"]') as HTMLElement;
    expect(grid.style.columnCount).toBe('2');
  });

  it('未提供断点配置时应该使用单列', () => {
    const { container } = render(MasonryGrid);

    const grid = container.querySelector('[data-testid="masonry-grid"]') as HTMLElement;
    expect(grid.style.columnCount).toBe('1');
  });
});

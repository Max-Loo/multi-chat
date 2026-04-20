/**
 * SkeletonList 组件单元测试
 *
 * 测试列表骨架屏：
 * - 默认数量
 * - 自定义数量
 * - 自定义高度和间距
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonList } from '@/components/Skeleton/SkeletonList';

// Mock shadcn Skeleton
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, variant }: { className?: string; variant?: string }) => (
    <div data-testid="skeleton-item" className={className} data-variant={variant} />
  ),
}));

describe('SkeletonList', () => {
  it('应该渲染默认 5 个骨架项', () => {
    const { container } = render(<SkeletonList />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    expect(items).toHaveLength(5);
  });

  it('应该渲染指定数量的骨架项', () => {
    const { container } = render(<SkeletonList count={3} />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    expect(items).toHaveLength(3);
  });

  it('应该渲染 1 个骨架项 当 count 为 1', () => {
    const { container } = render(<SkeletonList count={1} />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    expect(items).toHaveLength(1);
  });

  it('应该应用自定义 itemHeight', () => {
    const { container } = render(<SkeletonList count={1} itemHeight="h-20" />);

    const item = container.querySelector('[data-testid="skeleton-item"]');
    expect(item).toHaveClass('h-20');
  });

  it('应该应用自定义 gap', () => {
    const { container } = render(<SkeletonList gap="gap-6" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('gap-6');
  });

  it('应该应用自定义 className', () => {
    const { container } = render(<SkeletonList className="px-4" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('px-4');
  });
});

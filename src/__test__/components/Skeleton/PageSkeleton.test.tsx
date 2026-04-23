/**
 * PageSkeleton 组件单元测试
 *
 * 测试页面骨架屏：
 * - 桌面端布局（侧边栏 + 主内容）
 * - 移动端布局（主内容 + 底部导航占位）
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSkeleton } from '@/components/Skeleton/PageSkeleton';

// Mock useResponsive
const mockIsMobile = vi.fn();
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: mockIsMobile() }),
}));

// Mock shadcn Skeleton
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, variant }: { className?: string; variant?: string }) => (
    <div data-testid="skeleton-item" className={className} data-variant={variant} />
  ),
}));

describe('PageSkeleton', () => {
  it('应该渲染桌面端布局（侧边栏 + 主内容）当 isMobile 为 false', () => {
    mockIsMobile.mockReturnValue(false);

    const { container } = render(<PageSkeleton />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    // 桌面端应有侧边栏
    expect(screen.getByTestId('sidebar-skeleton')).toBeInTheDocument();
  });

  it('应该渲染移动端布局（无侧边栏）当 isMobile 为 true', () => {
    mockIsMobile.mockReturnValue(true);

    const { container } = render(<PageSkeleton />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-col');
    // 移动端不应有侧边栏
    expect(screen.queryByTestId('sidebar-skeleton')).not.toBeInTheDocument();
    // 应有底部导航占位
    expect(screen.getByTestId('mobile-bottom-nav-placeholder')).toBeInTheDocument();
  });
});

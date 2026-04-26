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
const mockIsMobile = vi.hoisted(() => vi.fn(() => false));
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({ ...globalThis.__createResponsiveMock(), isMobile: mockIsMobile() }),
}));

describe('PageSkeleton', () => {
  it('应该渲染桌面端布局（侧边栏 + 主内容）当 isMobile 为 false', () => {
    mockIsMobile.mockReturnValue(false);

    render(<PageSkeleton />);

    expect(screen.getByTestId('sidebar-skeleton')).toBeInTheDocument();
  });

  it('应该渲染移动端布局（无侧边栏）当 isMobile 为 true', () => {
    mockIsMobile.mockReturnValue(true);

    render(<PageSkeleton />);

    expect(screen.queryByTestId('sidebar-skeleton')).not.toBeInTheDocument();
    expect(screen.getByTestId('mobile-bottom-nav-placeholder')).toBeInTheDocument();
  });
});

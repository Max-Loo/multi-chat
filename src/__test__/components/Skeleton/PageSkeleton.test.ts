/**
 * PageSkeleton 组件测试
 *
 * 验证桌面端与移动端两种布局
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/vue';
import PageSkeleton from '@/components/Skeleton/PageSkeleton.vue';

const responsiveMock = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => responsiveMock,
}));

describe('PageSkeleton', () => {
  beforeEach(() => {
    responsiveMock.isMobile = false;
  });

  it('桌面端应该渲染侧边栏骨架 + 主内容骨架', () => {
    const { container } = render(PageSkeleton);

    expect(
      container.querySelector('[data-testid="sidebar-skeleton"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="mobile-bottom-nav-placeholder"]'),
    ).toBeNull();
  });

  it('移动端应该渲染主内容骨架 + 底部导航占位', () => {
    responsiveMock.isMobile = true;

    const { container } = render(PageSkeleton);

    expect(
      container.querySelector('[data-testid="mobile-bottom-nav-placeholder"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-testid="sidebar-skeleton"]')).toBeNull();
  });

  it('骨架屏应该对辅助技术隐藏', () => {
    const { container } = render(PageSkeleton);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

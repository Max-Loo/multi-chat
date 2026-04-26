/**
 * SkeletonList 组件单元测试
 *
 * 测试列表骨架屏：
 * - 渲染验证
 * - aria-hidden 辅助技术隐藏
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonList } from '@/components/Skeleton/SkeletonList';

describe('SkeletonList', () => {
  it('应该成功渲染默认骨架列表', () => {
    const { container } = render(<SkeletonList />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('应该成功渲染指定数量', () => {
    const { container } = render(<SkeletonList count={3} />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('应该有 aria-hidden 属性', () => {
    const { container } = render(<SkeletonList />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

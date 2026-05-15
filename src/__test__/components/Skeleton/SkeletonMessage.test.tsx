/**
 * SkeletonMessage 组件单元测试
 *
 * 测试聊天消息骨架屏：
 * - 渲染验证
 * - aria-hidden 辅助技术隐藏
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonMessage } from '@/components/Skeleton/SkeletonMessage';

describe('SkeletonMessage', () => {
  it('应该成功渲染默认骨架消息', () => {
    const { container } = render(<SkeletonMessage />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('应该成功渲染 isSelf 模式', () => {
    const { container } = render(<SkeletonMessage isSelf />);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flex-row-reverse');
  });

  it('应该有 aria-hidden 属性', () => {
    const { container } = render(<SkeletonMessage />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

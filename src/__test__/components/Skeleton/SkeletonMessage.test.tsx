/**
 * SkeletonMessage 组件单元测试
 *
 * 测试聊天消息骨架屏：
 * - isSelf 布局方向
 * - 消息行数
 * - 最后一行缩短
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonMessage } from '@/components/Skeleton/SkeletonMessage';

describe('SkeletonMessage', () => {
  it('应该使用 flex-row 当 isSelf 为 false（默认）', () => {
    const { container } = render(<SkeletonMessage />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-row');
  });

  it('应该使用 flex-row-reverse 当 isSelf 为 true', () => {
    const { container } = render(<SkeletonMessage isSelf />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-row-reverse');
  });

  it('应该渲染默认 3 行文本骨架', () => {
    const { container } = render(<SkeletonMessage />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    // 1 个头像 + 1 个用户名 + 3 行文本 = 5
    expect(items).toHaveLength(5);
  });

  it('应该渲染指定行数的文本骨架', () => {
    const { container } = render(<SkeletonMessage lines={5} />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    // 1 个头像 + 1 个用户名 + 5 行文本 = 7
    expect(items).toHaveLength(7);
  });

  it('应该最后一行宽度为 w-2/3', () => {
    const { container } = render(<SkeletonMessage lines={3} />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    // 最后一个骨架项（index 4: 头像0 + 用户名1 + 文本2,3,4）
    const lastTextItem = items[items.length - 1];
    expect(lastTextItem).toHaveClass('w-2/3');
  });

  it('应该非最后一行宽度为 w-full', () => {
    const { container } = render(<SkeletonMessage lines={3} />);

    const items = container.querySelectorAll('[data-testid="skeleton-item"]');
    // 第一行文本（index 2: 头像0 + 用户名1 + 文本2）
    const firstTextItem = items[2];
    expect(firstTextItem).toHaveClass('w-full');
  });

  it('应该应用自定义 className', () => {
    const { container } = render(<SkeletonMessage className="my-class" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('my-class');
  });

  it('应该渲染头像骨架', () => {
    const { container } = render(<SkeletonMessage />);

    // 第一个 skeleton-item 是头像
    const avatar = container.querySelector('[data-variant="circle"]');
    expect(avatar).toBeInTheDocument();
  });
});

/**
 * SkeletonMessage 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import SkeletonMessage from '@/components/Skeleton/SkeletonMessage.vue';

describe('SkeletonMessage', () => {
  it('应该按默认配置渲染骨架消息（头像 + 3 行文本）', () => {
    const { container } = render(SkeletonMessage);

    // 头像（圆形骨架）+ 用户名 + 3 行文本 = 5 个骨架块
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
    expect(container.firstElementChild).not.toHaveClass('flex-row-reverse');
  });

  it('isSelf 模式应该反转布局方向', () => {
    const { container } = render(SkeletonMessage, { props: { isSelf: true } });

    expect(container.firstElementChild).toHaveClass('flex-row-reverse');
  });

  it('应该支持自定义行数', () => {
    const { container } = render(SkeletonMessage, { props: { lines: 5 } });

    // 头像 + 用户名 + 5 行 = 7 个骨架块
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(7);
  });

  it('根元素应该对辅助技术隐藏', () => {
    const { container } = render(SkeletonMessage);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

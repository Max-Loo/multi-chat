/**
 * SkeletonList 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import SkeletonList from '@/components/Skeleton/SkeletonList.vue';

describe('SkeletonList', () => {
  it('应该按默认数量渲染骨架列表项', () => {
    const { container } = render(SkeletonList);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
  });

  it('应该按指定数量渲染', () => {
    const { container } = render(SkeletonList, { props: { count: 10 } });

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(10);
  });

  it('根元素应该对辅助技术隐藏', () => {
    const { container } = render(SkeletonList);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

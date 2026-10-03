/**
 * Vue 测试环境冒烟测试
 *
 * 验证 @testing-library/vue 在 happy-dom 中可正常挂载 Vue3 组件并模拟交互
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/vue';
import { defineComponent, h, ref } from 'vue';

/** 空组件：仅渲染一个带 testid 的 div */
const Empty = defineComponent({
  setup() {
    return () => h('div', { 'data-testid': 'empty-root' });
  },
});

/** 计数器组件：验证响应式状态变更反映到渲染输出 */
const Counter = defineComponent({
  setup() {
    const count = ref(0);
    const increment = () => {
      count.value += 1;
    };
    return () =>
      h('div', [
        h('span', { 'data-testid': 'count' }, String(count.value)),
        h('button', { 'data-testid': 'increment', onClick: increment }, '+1'),
      ]);
  },
});

describe('Vue 测试环境冒烟', () => {
  it('render 挂载空 Vue 组件并返回查询对象', () => {
    const { getByTestId } = render(Empty);

    expect(getByTestId('empty-root')).toBeInTheDocument();
  });

  it('模拟点击触发事件处理器并验证响应式状态变化', async () => {
    const { getByTestId } = render(Counter);

    expect(getByTestId('count').textContent).toBe('0');

    await fireEvent.click(getByTestId('increment'));

    expect(getByTestId('count').textContent).toBe('1');
  });
});

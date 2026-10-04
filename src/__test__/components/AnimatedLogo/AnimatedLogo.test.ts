/**
 * AnimatedLogo 组件测试
 *
 * 通过 stub getContext 返回 null 模拟 Canvas 不支持的环境，
 * 组件应降级为静态 MC 文本；动画绘制逻辑由 canvas-logo.test.ts 覆盖
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { render } from '@testing-library/vue';
import AnimatedLogo from '@/components/AnimatedLogo/AnimatedLogo.vue';

describe('AnimatedLogo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Canvas 不可用时应降级显示 MC 文本', async () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    const { container } = render(AnimatedLogo);
    // 降级判定发生在 onMounted，需等待一个 tick
    await nextTick();

    expect(container.querySelector('canvas')).toBeNull();
    const fallback = container.querySelector('[role="img"]');
    expect(fallback).toHaveAttribute('aria-label', 'Multi-Chat Logo');
    expect(fallback?.textContent).toContain('MC');

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('Canvas 可用时应该渲染 canvas 元素', () => {
    const { container } = render(AnimatedLogo);

    // happy-dom 提供 2d context stub，走正常渲染分支
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});

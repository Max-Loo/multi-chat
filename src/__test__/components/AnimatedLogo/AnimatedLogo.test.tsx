/**
 * AnimatedLogo 组件单元测试
 *
 * 测试 Canvas 动画 Logo 组件的行为：
 * - Canvas 元素渲染
 * - prefers-reduced-motion 支持
 * - 组件卸载清理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedLogo from '@/components/AnimatedLogo/AnimatedLogo';
import { drawStaticFrame } from '@/components/AnimatedLogo/canvas-logo';

// Mock canvas-logo 模块
vi.mock('@/components/AnimatedLogo/canvas-logo', () => ({
  createInitialState: () => ({
    time: 0,
    bubbleDots: [0, 0, 0] as [number, number, number],
    eyeBrightness: 1,
    antennaAngle: 0,
    headTilt: 0,
    breathOffset: 0,
    leftKeyY: 0,
    rightKeyY: 0,
    activeKeyIndex: 0,
    floatOffset: 0,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: mock 函数不需要实现完整的 AnimationState 类型
  updateState: (state: any, dt: number) => ({ ...state, time: state.time + dt }),
  draw: vi.fn(),
  drawStaticFrame: vi.fn(),
  calculateScale: () => 1,
}));

describe('AnimatedLogo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(drawStaticFrame).mockClear();
    // Mock Canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      scale: vi.fn(),
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: CanvasRenderingContext2D 包含 50+ 必填属性和方法，测试 mock 只需实现核心绘制方法
    }) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('应该渲染 Canvas 元素 当组件挂载', () => {
    render(<AnimatedLogo />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('应该设置正确的 aria-label', () => {
    render(<AnimatedLogo />);

    const canvas = screen.getByRole('img');
    expect(canvas).toHaveAttribute('aria-label', 'Multi-Chat 动态 Logo');
  });

  it('应该显示降级内容 当 Canvas 不被支持', () => {
    // Mock getContext 返回 null 模拟不支持
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

    render(<AnimatedLogo />);

    expect(screen.getByText('MC')).toBeInTheDocument();
  });

  it('应该启动 requestAnimationFrame 当未设置 reduced-motion', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    render(<AnimatedLogo />);

    expect(rafSpy).toHaveBeenCalled();
  });

  it('应该使用静态帧 当 prefers-reduced-motion 为 reduce', () => {
    // Mock matchMedia 返回 reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<AnimatedLogo />);

    expect(drawStaticFrame).toHaveBeenCalled();
  });

  it('应该清理动画帧 当组件卸载', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = render(<AnimatedLogo />);

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('应该清理 ResizeObserver 当组件卸载', () => {
    const disconnectSpy = vi.spyOn(ResizeObserver.prototype, 'disconnect');

    const { unmount } = render(<AnimatedLogo />);

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('应该处理高 DPR 显示', () => {
    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      writable: true,
    });

    render(<AnimatedLogo />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });
});

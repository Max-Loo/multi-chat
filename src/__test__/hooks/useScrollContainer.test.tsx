import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useScrollContainer } from '@/hooks/useScrollContainer';

/**
 * 测试包装组件：将 scrollContainerRef 绑定到 DOM 元素以触发 useEffect
 */
function TestScrollContainer() {
  const { scrollContainerRef, scrollbarClassname } = useScrollContainer();
  return (
    <div
      ref={scrollContainerRef}
      data-testid="scroll-container"
      data-classname={scrollbarClassname}
    />
  );
}

describe('useScrollContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('返回值测试', () => {
    it('应该返回 scrollContainerRef 和 scrollbarClassname 当 hook 被调用', () => {
      render(<TestScrollContainer />);
      const el = screen.getByTestId('scroll-container');

      expect(el).toBeInTheDocument();
      expect(el.dataset.classname).toBe('scrollbar-none');
    });
  });

  describe('scroll 事件自动绑定', () => {
    it('应该在挂载后绑定 scroll 事件监听器 当 ref 指向 DOM 元素', () => {
      const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');

      render(<TestScrollContainer />);

      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

      addSpy.mockRestore();
    });
  });

  describe('scroll 事件自动解绑', () => {
    it('应该在卸载后移除 scroll 事件监听器 当组件卸载', () => {
      const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
      const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

      const { unmount } = render(<TestScrollContainer />);

      const scrollCalls = addSpy.mock.calls.filter(call => call[0] === 'scroll');
      const lastAddCall = scrollCalls.at(-1)!;
      const boundHandler = lastAddCall[1];

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('scroll', boundHandler);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('滚动触发样式切换', () => {
    it('应该将 scrollbarClassname 从 scrollbar-none 变为 scrollbar-thin 当滚动事件触发', () => {
      render(<TestScrollContainer />);
      const el = screen.getByTestId('scroll-container');

      expect(el.dataset.classname).toBe('scrollbar-none');

      act(() => {
        el.dispatchEvent(new Event('scroll'));
      });

      expect(el.dataset.classname).toBe('scrollbar-thin');
    });
  });

  describe('ref 为空时的安全处理', () => {
    it('不应该崩溃 当 ref 未绑定到 DOM 元素', () => {
      function TestWithoutRef() {
        const { scrollbarClassname } = useScrollContainer();
        return <div data-classname={scrollbarClassname} />;
      }

      const { unmount } = render(<TestWithoutRef />);

      // 如果 early return 失效，container.addEventListener 会抛出 TypeError
      // 组件正常渲染 + 卸载说明 null 检查生效
      expect(() => unmount()).not.toThrow();
    });
  });
});

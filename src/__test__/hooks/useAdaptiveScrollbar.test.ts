import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveScrollbar } from '@/hooks/useAdaptiveScrollbar';

describe('useAdaptiveScrollbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('滚动条样式应用测试', () => {
    it('应默认隐藏滚动条', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      expect(result.current.scrollbarClassname).toBe('scrollbar-none');
      expect(result.current.isScrolling).toBe(false);
    });

    it('应在滚动时显示滚动条', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.scrollbarClassname).toBe('scrollbar-thin');
      expect(result.current.isScrolling).toBe(true);
    });

    it('应在延迟后隐藏滚动条', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar({ hideDebounceMs: 500 }));

      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.isScrolling).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isScrolling).toBe(false);
      expect(result.current.scrollbarClassname).toBe('scrollbar-none');
    });
  });

  describe('定时器行为测试', () => {
    it('应在多次滚动时重置定时器', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result } = renderHook(() => useAdaptiveScrollbar({ hideDebounceMs: 1000 }));

      act(() => {
        result.current.onScrollEvent();
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onScrollEvent();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isScrolling).toBe(false);

      clearTimeoutSpy.mockRestore();
    });

    it('应在参数变化时清理之前的定时器', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result } = renderHook(
        ({ hideDebounceMs }) => useAdaptiveScrollbar({ hideDebounceMs }),
        { initialProps: { hideDebounceMs: 500 } }
      );

      act(() => {
        result.current.onScrollEvent();
      });

      const firstTimeoutCalls = clearTimeoutSpy.mock.calls.length;

      act(() => {
        result.current.onScrollEvent();
      });

      const secondTimeoutCalls = clearTimeoutSpy.mock.calls.length;

      expect(secondTimeoutCalls).toBeGreaterThan(firstTimeoutCalls);

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('自定义延迟时间测试', () => {
    it('应支持自定义延迟时间', () => {
      const { result } = renderHook(() =>
        useAdaptiveScrollbar({ hideDebounceMs: 200 })
      );

      act(() => {
        result.current.onScrollEvent();
      });

      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(result.current.isScrolling).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.isScrolling).toBe(false);
    });

    it('应使用默认延迟时间（500ms）', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      act(() => {
        result.current.onScrollEvent();
      });

      act(() => {
        vi.advanceTimersByTime(499);
      });

      expect(result.current.isScrolling).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.isScrolling).toBe(false);
    });
  });

  describe('onScrollEvent 测试', () => {
    it('应正确触发滚动事件', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      expect(result.current.isScrolling).toBe(false);

      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.isScrolling).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isScrolling).toBe(false);

      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.isScrolling).toBe(true);
    });

    it('应支持连续快速滚动', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar({ hideDebounceMs: 500 }));

      act(() => {
        result.current.onScrollEvent();
        result.current.onScrollEvent();
        result.current.onScrollEvent();
        result.current.onScrollEvent();
      });

      expect(result.current.isScrolling).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isScrolling).toBe(false);
    });
  });

  describe('isScrolling 状态测试', () => {
    it('应正确反映滚动状态', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      expect(result.current.isScrolling).toBe(false);

      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.isScrolling).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isScrolling).toBe(false);
    });

    it('应允许外部使用 isScrolling 状态', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      const externalState1 = result.current.isScrolling;
      expect(externalState1).toBe(false);

      act(() => {
        result.current.onScrollEvent();
      });

      const externalState2 = result.current.isScrolling;
      expect(externalState2).toBe(true);
    });
  });
});

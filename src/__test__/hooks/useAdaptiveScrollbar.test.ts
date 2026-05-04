import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveScrollbar } from '@/hooks/useAdaptiveScrollbar';

describe('useAdaptiveScrollbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
      const { result } = renderHook(() => useAdaptiveScrollbar({ hideDebounceMs: 1000 }));

      act(() => {
        result.current.onScrollEvent();
      });

      // 未满延迟时间，仍在滚动中
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isScrolling).toBe(true);

      // 再次滚动，重置定时器
      act(() => {
        result.current.onScrollEvent();
      });

      // 300ms 不足以隐藏（因为定时器被重置了）
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isScrolling).toBe(true);

      // 再过 700ms 才到达 1000ms 总延迟
      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(result.current.isScrolling).toBe(false);
    });

    it('应在参数变化时清理之前的定时器', () => {
      const { result } = renderHook(
        ({ hideDebounceMs }) => useAdaptiveScrollbar({ hideDebounceMs }),
        { initialProps: { hideDebounceMs: 500 } }
      );

      act(() => {
        result.current.onScrollEvent();
      });

      // 第一次滚动，延迟 500ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isScrolling).toBe(true);

      // 再次滚动，重置定时器
      act(() => {
        result.current.onScrollEvent();
      });

      // 500ms 后应该隐藏
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isScrolling).toBe(false);
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

  describe('定时器重置精确验证', () => {
    it('应在连续滚动时清除前一个定时器并保持滚动状态', () => {
      // 使用 500ms 默认延迟
      const { result } = renderHook(() => useAdaptiveScrollbar());

      // 第一次滚动，启动 timer1（500ms）
      act(() => {
        result.current.onScrollEvent();
      });

      // 前进 200ms，timer1 还剩 300ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isScrolling).toBe(true);

      // 第二次滚动，应清除 timer1 并启动 timer2（500ms）
      act(() => {
        result.current.onScrollEvent();
      });

      // 如果 clearTimeout 未被调用，timer1 会在 500ms 总计（即再过 300ms）时触发
      // 前进 300ms：如果 clearTimeout 生效，timer2 还剩 200ms，isScrolling 应为 true
      // 如果 clearTimeout 未生效，timer1 在此触发，isScrolling 变为 false
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // 关键断言：timer1 被清除后，只有 timer2 在运行，300ms 不足以触发
      expect(result.current.isScrolling).toBe(true);

      // 再前进 200ms，timer2 总计 500ms 触发
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isScrolling).toBe(false);
    });

    it('应在首次滚动时不调用 clearTimeout（定时器引用为 null）', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      // 首次滚动，timeoutRef.current 为 null
      // 不应抛错
      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.isScrolling).toBe(true);
    });
  });

  describe('CSS 类名切换边界验证', () => {
    it('应在滚动和停止之间正确切换 CSS 类名', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      expect(result.current.scrollbarClassname).toBe('scrollbar-none');

      act(() => {
        result.current.onScrollEvent();
      });

      expect(result.current.scrollbarClassname).toBe('scrollbar-thin');

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.scrollbarClassname).toBe('scrollbar-none');
    });

    it('应在多次滚动-停止周期中正确切换', () => {
      const { result } = renderHook(() => useAdaptiveScrollbar());

      // 周期 1
      act(() => { result.current.onScrollEvent(); });
      expect(result.current.scrollbarClassname).toBe('scrollbar-thin');
      act(() => { vi.advanceTimersByTime(500); });
      expect(result.current.scrollbarClassname).toBe('scrollbar-none');

      // 周期 2
      act(() => { result.current.onScrollEvent(); });
      expect(result.current.scrollbarClassname).toBe('scrollbar-thin');
      act(() => { vi.advanceTimersByTime(500); });
      expect(result.current.scrollbarClassname).toBe('scrollbar-none');
    });
  });

  describe('自定义 hideDebounceMs 参数验证', () => {
    it('应使用自定义延迟 1000ms', () => {
      const { result } = renderHook(() =>
        useAdaptiveScrollbar({ hideDebounceMs: 1000 })
      );

      act(() => { result.current.onScrollEvent(); });

      act(() => { vi.advanceTimersByTime(999); });
      expect(result.current.isScrolling).toBe(true);

      act(() => { vi.advanceTimersByTime(1); });
      expect(result.current.isScrolling).toBe(false);
    });

    it('应使用自定义延迟 200ms', () => {
      const { result } = renderHook(() =>
        useAdaptiveScrollbar({ hideDebounceMs: 200 })
      );

      act(() => { result.current.onScrollEvent(); });

      act(() => { vi.advanceTimersByTime(199); });
      expect(result.current.isScrolling).toBe(true);

      act(() => { vi.advanceTimersByTime(1); });
      expect(result.current.isScrolling).toBe(false);
    });
  });
});

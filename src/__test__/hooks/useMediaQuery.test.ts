import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  const mockMatchMedia = vi.fn();
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    if (typeof window !== 'undefined') {
      window.matchMedia = mockMatchMedia;
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.matchMedia = originalMatchMedia;
    }
    mockMatchMedia.mockReset();
  });

  describe('基础功能测试', () => {
    it('应该返回初始匹配状态 当 hook 初始化', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(true);
    });

    it('应该返回 false 当媒体查询不匹配', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);
    });
  });

  describe('事件监听测试', () => {
    it('应该添加事件监听器 当 hook 初始化', () => {
      const mediaQueryList = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockMatchMedia.mockReturnValue(mediaQueryList);

      renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('应该移除事件监听器 当 hook 卸载', () => {
      const mediaQueryList = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      unmount();

      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('应该更新匹配状态 当媒体查询变化（150ms 节流）', () => {
      vi.useFakeTimers();

      let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
      const mediaQueryList = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockMatchMedia.mockReturnValue(mediaQueryList);

      mediaQueryList.addEventListener.mockImplementation(
        (event: string, listener: any) => {
          if (event === 'change') {
            changeListener = listener;
          }
        }
      );

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);

      act(() => {
        if (changeListener) {
          const event = new MediaQueryListEvent('change', { matches: true });
          changeListener(event);
        }
      });

      // 节流：立即响应第一次变化
      expect(result.current).toBe(true);

      // 再次触发变化（在节流间隔内）
      act(() => {
        if (changeListener) {
          const event = new MediaQueryListEvent('change', { matches: false });
          changeListener(event);
        }
      });

      // 在节流间隔内（150ms），状态应该还未更新
      expect(result.current).toBe(true);

      // 前进 150ms，节流间隔结束
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // 节流后，状态应该已更新为最后一次变化的值
      expect(result.current).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('边界条件测试', () => {
    it('应该支持多个媒体查询监听', () => {
      const mediaQueryList1 = {
        matches: true,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      const mediaQueryList2 = {
        matches: false,
        media: '(min-width: 1280px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      mockMatchMedia
        .mockReturnValueOnce(mediaQueryList1)
        .mockReturnValueOnce(mediaQueryList2);

      const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1280px)'));

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(false);
    });
  });

  describe('query 参数变更测试', () => {
    it('应在 query 变更时重新注册监听器', () => {
      const mediaQueryList1 = {
        matches: true,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      const mediaQueryList2 = {
        matches: false,
        media: '(min-width: 1024px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      // useState 初始化调用一次 + useEffect 调用一次 = 两次
      mockMatchMedia
        .mockReturnValueOnce(mediaQueryList1)
        .mockReturnValueOnce(mediaQueryList1)
        .mockReturnValueOnce(mediaQueryList2)
        .mockReturnValueOnce(mediaQueryList2);

      const { rerender, result } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      expect(result.current).toBe(true);

      // 变更 query
      rerender({ query: '(min-width: 1024px)' });

      // 应在新媒体查询上注册监听器
      expect(mediaQueryList2.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );

      // 应清理旧媒体查询的监听器
      expect(mediaQueryList1.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );

      // 验证 throttle handler 在不同 query 间是同一个引用（复用）
      const handler1 = mediaQueryList1.addEventListener.mock.calls[0][1];
      const handler2 = mediaQueryList2.addEventListener.mock.calls[0][1];
      expect(handler1).toBe(handler2);
    });

    it('应在 query 变更时重新创建 matchMedia 并注册监听', () => {
      const mediaQueryList1 = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      const mediaQueryList2 = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      // useState 初始化调用一次 + useEffect 调用一次 = 两次
      mockMatchMedia
        .mockReturnValueOnce(mediaQueryList1)
        .mockReturnValueOnce(mediaQueryList1)
        .mockReturnValueOnce(mediaQueryList2)
        .mockReturnValueOnce(mediaQueryList2);

      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      // 第一次：注册了 query1 的监听器
      expect(mediaQueryList1.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');

      // 变更 query
      rerender({ query: '(prefers-color-scheme: dark)' });

      // 第二次：应重新调用 matchMedia 并注册新监听器
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mediaQueryList2.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      // 清理旧监听器
      expect(mediaQueryList1.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('卸载时清理监听器测试', () => {
    it('应在卸载时调用 removeEventListener', () => {
      const mediaQueryList = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(mediaQueryList.addEventListener).toHaveBeenCalled();

      unmount();

      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('150ms 节流 leading/trailing 行为测试', () => {
    it('应在首次变化时立即响应（leading）', () => {
      let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
      const mediaQueryList = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event: string, listener: any) => {
          changeListener = listener;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);

      // 第一次 change 事件应立即更新（leading）
      act(() => {
        changeListener!(new MediaQueryListEvent('change', { matches: true }));
      });

      expect(result.current).toBe(true);
    });

    it('应在 150ms 内的中间变化被节流丢弃', () => {
      vi.useFakeTimers();

      let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
      const mediaQueryList = {
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event: string, listener: any) => {
          changeListener = listener;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      // 第一次变化：leading，立即响应
      act(() => {
        changeListener!(new MediaQueryListEvent('change', { matches: true }));
      });
      expect(result.current).toBe(true);

      // 第二次变化：在 150ms 节流间隔内，应被丢弃
      act(() => {
        changeListener!(new MediaQueryListEvent('change', { matches: false }));
      });
      expect(result.current).toBe(true); // 仍然是 true（第二次被节流）

      // 第三次变化：仍在 150ms 内
      act(() => {
        changeListener!(new MediaQueryListEvent('change', { matches: true }));
      });

      // 等待 150ms 过去，trailing 应该触发最后一次变化
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(result.current).toBe(true); // trailing 响应最后一次（matches: true）

      vi.useRealTimers();
    });
  });
});

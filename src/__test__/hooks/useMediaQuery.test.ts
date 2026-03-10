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
});

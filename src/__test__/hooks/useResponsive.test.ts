import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useResponsive } from '@/hooks/useResponsive';

describe('useResponsive', () => {
  const mockMatchMedia = vi.fn();
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

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
    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
    window.matchMedia = originalMatchMedia;
    mockMatchMedia.mockReset();
  });

  describe('layoutMode 计算测试', () => {
    it('应该返回 mobile 当宽度小于 768px', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      expect(result.current.layoutMode).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isCompact).toBe(false);
      expect(result.current.isCompressed).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('应该返回 compact 当宽度在 768px-1023px', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px) and (max-width: 1023px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      expect(result.current.layoutMode).toBe('compact');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isCompact).toBe(true);
      expect(result.current.isCompressed).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('应该返回 compressed 当宽度在 1024px-1279px', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(min-width: 1024px) and (max-width: 1279px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      expect(result.current.layoutMode).toBe('compressed');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isCompact).toBe(false);
      expect(result.current.isCompressed).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('应该返回 desktop 当宽度大于等于 1280px', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(min-width: 1280px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      expect(result.current.layoutMode).toBe('desktop');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isCompact).toBe(false);
      expect(result.current.isCompressed).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('窗口尺寸测试', () => {
    it('应该返回正确的窗口宽度', () => {
      window.innerWidth = 1366;

      const { result } = renderHook(() => useResponsive());

      expect(result.current.width).toBe(1366);
    });

    it('应该返回正确的窗口高度', () => {
      window.innerHeight = 768;

      const { result } = renderHook(() => useResponsive());

      expect(result.current.height).toBe(768);
    });
  });

  describe('布尔值快捷方式测试', () => {
    it('应该提供正确的布尔值快捷方式', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px) and (max-width: 1023px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useResponsive());

      expect(typeof result.current.isMobile).toBe('boolean');
      expect(typeof result.current.isCompact).toBe('boolean');
      expect(typeof result.current.isCompressed).toBe('boolean');
      expect(typeof result.current.isDesktop).toBe('boolean');
    });
  });

  describe('媒体查询监听测试', () => {
    it('应该监听所有相关媒体查询', () => {
      renderHook(() => useResponsive());

      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1023px)');
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px) and (max-width: 1279px)');
      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1280px)');
    });
  });
});

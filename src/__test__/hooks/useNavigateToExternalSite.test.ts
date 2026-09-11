import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useNavigateToExternalSite } from '@/hooks/useNavigateToExternalSite';

describe('useNavigateToExternalSite', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('基础功能测试', () => {
    it('应调用 window.open() 打开链接', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com');

      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('应支持多个URL连续打开', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example1.com');
      result.current.navToExternalSite('https://example2.com');
      result.current.navToExternalSite('https://example3.com');

      expect(openSpy).toHaveBeenCalledTimes(3);
      expect(openSpy).toHaveBeenNthCalledWith(1, 'https://example1.com', '_blank', 'noopener,noreferrer');
      expect(openSpy).toHaveBeenNthCalledWith(2, 'https://example2.com', '_blank', 'noopener,noreferrer');
      expect(openSpy).toHaveBeenNthCalledWith(3, 'https://example3.com', '_blank', 'noopener,noreferrer');
    });

    it('应支持带查询参数的URL', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com?param1=value1&param2=value2');

      expect(openSpy).toHaveBeenCalledWith('https://example.com?param1=value1&param2=value2', '_blank', 'noopener,noreferrer');
    });
  });

  describe('打开方式测试', () => {
    it('应以新标签页打开且不泄露 referrer', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com');

      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });
  });

  describe('错误处理测试', () => {
    it('应处理无效的URL', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('not-a-valid-url');

      expect(openSpy).toHaveBeenCalledWith('not-a-valid-url', '_blank', 'noopener,noreferrer');
    });

    it('应处理空字符串', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('');

      expect(openSpy).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');
    });
  });
});

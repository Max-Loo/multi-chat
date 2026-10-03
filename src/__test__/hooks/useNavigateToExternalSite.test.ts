import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useNavigateToExternalSite } from '@/hooks/useNavigateToExternalSite';

describe('useNavigateToExternalSite', () => {

  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {

    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

  });

  afterEach(() => {

    windowOpenSpy.mockRestore();

    vi.restoreAllMocks();

  });

  describe('基础功能测试', () => {

    it('应调用 window.open() 在新标签页打开链接', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com');

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);

    });

    it('应支持多个URL连续打开', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example1.com');

      result.current.navToExternalSite('https://example2.com');

      result.current.navToExternalSite('https://example3.com');

      expect(windowOpenSpy).toHaveBeenCalledTimes(3);

      expect(windowOpenSpy).toHaveBeenNthCalledWith(1, 'https://example1.com', '_blank', 'noopener,noreferrer');

      expect(windowOpenSpy).toHaveBeenNthCalledWith(2, 'https://example2.com', '_blank', 'noopener,noreferrer');

      expect(windowOpenSpy).toHaveBeenNthCalledWith(3, 'https://example3.com', '_blank', 'noopener,noreferrer');

    });

    it('应支持带查询参数的URL', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com?param1=value1&param2=value2');

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com?param1=value1&param2=value2', '_blank', 'noopener,noreferrer');

    });

  });

  describe('安全语义测试', () => {

    it('应使用 noopener,noreferrer 防止反向标签页劫持', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://untrusted.com');

      const [, target, features] = windowOpenSpy.mock.calls[0];

      expect(target).toBe('_blank');

      expect(features).toContain('noopener');

      expect(features).toContain('noreferrer');

    });

  });

  describe('边界情况测试', () => {

    it('应处理无效的URL', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('not-a-valid-url');

      expect(windowOpenSpy).toHaveBeenCalledWith('not-a-valid-url', '_blank', 'noopener,noreferrer');

    });

    it('应处理空字符串', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('');

      expect(windowOpenSpy).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');

    });

  });

});

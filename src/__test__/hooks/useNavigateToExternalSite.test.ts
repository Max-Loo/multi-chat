import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigateToExternalSite } from '@/hooks/useNavigateToExternalSite';
import * as tauriCompat from '@/utils/tauriCompat';

describe('useNavigateToExternalSite', () => {
  let shellOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    shellOpenSpy = vi.spyOn(tauriCompat.shell, 'open').mockResolvedValue(undefined);
  });

  afterEach(() => {
    shellOpenSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('基础功能测试', () => {
    it('应调用 shell.open() 打开链接', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com');

      expect(shellOpenSpy).toHaveBeenCalledWith('https://example.com');
      expect(shellOpenSpy).toHaveBeenCalledTimes(1);
    });

    it('应支持多个URL连续打开', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example1.com');
      result.current.navToExternalSite('https://example2.com');
      result.current.navToExternalSite('https://example3.com');

      expect(shellOpenSpy).toHaveBeenCalledTimes(3);
      expect(shellOpenSpy).toHaveBeenNthCalledWith(1, 'https://example1.com');
      expect(shellOpenSpy).toHaveBeenNthCalledWith(2, 'https://example2.com');
      expect(shellOpenSpy).toHaveBeenNthCalledWith(3, 'https://example3.com');
    });

    it('应支持带查询参数的URL', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://example.com?param1=value1&param2=value2');

      expect(shellOpenSpy).toHaveBeenCalledWith('https://example.com?param1=value1&param2=value2');
    });
  });

  describe('Tauri 兼容层测试', () => {
    it('应正确调用 tauriCompat.shell.open', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://tauri-app.com');

      expect(shellOpenSpy).toHaveBeenCalledWith('https://tauri-app.com');
    });

    it('应在 Tauri 环境下使用 shell.open', () => {
      vi.stubGlobal('__TAURI__', {
        __scope: { platform: 'darwin' },
      });

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://tauri-app.com');

      expect(shellOpenSpy).toHaveBeenCalledWith('https://tauri-app.com');

      vi.unstubAllGlobals();
    });

    it('应在 Web 环境下使用 shell.open（兼容层内部调用 window.open）', () => {
      delete (window as any).__TAURI__;

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://web-app.com');

      expect(shellOpenSpy).toHaveBeenCalledWith('https://web-app.com');
    });
  });

  describe('错误处理测试', () => {
    it('应处理无效的URL', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('not-a-valid-url');

      expect(shellOpenSpy).toHaveBeenCalledWith('not-a-valid-url');
    });

    it('应处理空字符串', () => {
      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('');

      expect(shellOpenSpy).toHaveBeenCalledWith('');
    });
  });

  describe('Mock 验证测试', () => {
    it('应正确 mock shell.open 方法', () => {
      const customMock = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(tauriCompat.shell, 'open').mockImplementation(customMock);

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://test.com');

      expect(customMock).toHaveBeenCalledTimes(1);
      expect(customMock).toHaveBeenCalledWith('https://test.com');
    });

    it('应在每次调用后重置 mock', () => {
      shellOpenSpy.mockClear();

      const { result } = renderHook(() => useNavigateToExternalSite());

      result.current.navToExternalSite('https://test.com');

      expect(shellOpenSpy).toHaveBeenCalledTimes(1);
      expect(shellOpenSpy).toHaveBeenCalledWith('https://test.com');
    });
  });
});

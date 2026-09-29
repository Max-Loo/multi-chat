import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useNavigateToExternalSite } from '@/hooks/useNavigateToExternalSite';

import * as webRuntime from '@/utils/webRuntime';



describe('useNavigateToExternalSite', () => {

  let shellOpenSpy: ReturnType<typeof vi.spyOn>;



  beforeEach(() => {

    shellOpenSpy = vi.spyOn(webRuntime.shell, 'open').mockResolvedValue(undefined);

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



  describe('webRuntime 集成测试', () => {

    it('应正确调用 webRuntime.shell.open', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('https://example-external.com');



      expect(shellOpenSpy).toHaveBeenCalledWith('https://example-external.com');

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



});

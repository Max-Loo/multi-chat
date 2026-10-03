import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useNavigateToExternalSite } from '@/hooks/useNavigateToExternalSite';

// Mock openExternal 模块，验证外链打开行为
vi.mock('@/utils/openExternal', () => ({
  openExternal: vi.fn(),
}));

import { openExternal } from '@/utils/openExternal';

describe('useNavigateToExternalSite', () => {

  beforeEach(() => {

    vi.mocked(openExternal).mockClear();

  });



  afterEach(() => {

    vi.restoreAllMocks();

  });



  describe('基础功能测试', () => {

    it('应调用 openExternal() 打开链接', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('https://example.com');



      expect(openExternal).toHaveBeenCalledWith('https://example.com');

      expect(openExternal).toHaveBeenCalledTimes(1);

    });



    it('应支持多个URL连续打开', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('https://example1.com');

      result.current.navToExternalSite('https://example2.com');

      result.current.navToExternalSite('https://example3.com');



      expect(openExternal).toHaveBeenCalledTimes(3);

      expect(openExternal).toHaveBeenNthCalledWith(1, 'https://example1.com');

      expect(openExternal).toHaveBeenNthCalledWith(2, 'https://example2.com');

      expect(openExternal).toHaveBeenNthCalledWith(3, 'https://example3.com');

    });



    it('应支持带查询参数的URL', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('https://example.com?param1=value1&param2=value2');



      expect(openExternal).toHaveBeenCalledWith('https://example.com?param1=value1&param2=value2');

    });

  });



  describe('openExternal 调用测试', () => {

    it('应正确调用 openExternal 传递目标地址', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('https://open-external.com');



      expect(openExternal).toHaveBeenCalledWith('https://open-external.com');

    });

  });



  describe('错误处理测试', () => {

    it('应处理无效的URL', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('not-a-valid-url');



      expect(openExternal).toHaveBeenCalledWith('not-a-valid-url');

    });



    it('应处理空字符串', () => {

      const { result } = renderHook(() => useNavigateToExternalSite());



      result.current.navToExternalSite('');



      expect(openExternal).toHaveBeenCalledWith('');

    });

  });



});

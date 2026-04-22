import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('基础功能测试', () => {
    it('应该立即返回初始值 当 hook 初始化', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    it('应该延迟更新值 当输入值变化', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('应该只返回最后一次的值 当在延迟期间多次更新', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'update1', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('initial');

      rerender({ value: 'update2', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('initial');

      rerender({ value: 'update3', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('update3');
    });
  });



  describe('参数变化测试', () => {
    it('应该重新设置定时器 当 delay 参数变化时', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('泛型类型测试', () => {
    it('应该支持 string 类型 当使用字符串类型', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce<string>(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('应该支持 number 类型 当使用数字类型', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce<number>(value, delay),
        { initialProps: { value: 0, delay: 500 } }
      );

      rerender({ value: 100, delay: 500 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(100);
    });

    it('应该支持 object 类型 当使用对象类型', () => {
      const initialObj = { name: 'Alice', age: 25 };
      const updatedObj = { name: 'Bob', age: 30 };

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce<{ name: string; age: number }>(value, delay),
        { initialProps: { value: initialObj, delay: 500 } }
      );

      rerender({ value: updatedObj, delay: 500 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(updatedObj);
    });

    it('应该支持 array 类型 当使用数组类型', () => {
      const initialArr = [1, 2, 3];
      const updatedArr = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce<number[]>(value, delay),
        { initialProps: { value: initialArr, delay: 500 } }
      );

      rerender({ value: updatedArr, delay: 500 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(updatedArr);
    });
  });
});

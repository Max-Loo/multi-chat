/**
 * useDebouncedFilter 单元测试
 *
 * 测试防抖过滤 Hook 的延迟过滤、空文本、清理行为
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebouncedFilter } from '@/components/FilterInput/hooks/useDebouncedFilter';

const filterList = ['apple', 'banana', 'cherry', 'date'];
const filterPredicate = (item: string) => item.includes('a');

describe('useDebouncedFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基础功能', () => {
    it('应该返回完整列表 当 text 为空字符串', () => {
      const { result } = renderHook(() =>
        useDebouncedFilter('', filterList, filterPredicate),
      );

      expect(result.current.filteredList).toEqual(filterList);
    });

    it('应该返回过滤结果 当 text 非空且防抖延迟已过', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useDebouncedFilter(text, filterList, filterPredicate, 200),
        { initialProps: { text: '' } },
      );

      // 初始返回完整列表
      expect(result.current.filteredList).toEqual(filterList);

      // 输入过滤文本
      rerender({ text: 'a' });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // 过滤后只包含含 'a' 的项
      expect(result.current.filteredList).toEqual(['apple', 'banana', 'date']);
    });

    it('应该使用旧结果 当防抖延迟未到', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useDebouncedFilter(text, filterList, filterPredicate, 200),
        { initialProps: { text: '' } },
      );

      rerender({ text: 'ch' });

      // 防抖期间仍是上一次结果（完整列表）
      expect(result.current.filteredList).toEqual(filterList);
    });
  });

  describe('清理行为', () => {
    it('应该取消未执行的防抖函数 当组件卸载', () => {
      const { result, unmount, rerender } = renderHook(
        ({ text }) => useDebouncedFilter(text, filterList, filterPredicate, 200),
        { initialProps: { text: '' } },
      );

      rerender({ text: 'a' });
      unmount();

      // 卸载后推进时间，防抖函数不应执行
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // 结果不变（已经卸载，不会有新的状态更新）
      expect(result.current.filteredList).toEqual(filterList);
    });
  });
});

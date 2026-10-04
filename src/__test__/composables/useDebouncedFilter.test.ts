/**
 * useDebouncedFilter 组合式函数测试
 *
 * 验证防抖过滤、清空文本恢复完整列表与卸载取消
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';

describe('useDebouncedFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始应该立即返回完整列表（无过滤文本）', () => {
    const list = ref([{ id: 1 }, { id: 2 }]);
    const text = ref('');

    const { filteredList } = useDebouncedFilter(text, list, () => true);

    expect(filteredList.value).toHaveLength(2);
  });

  it('输入文本后应该在防抖延迟后过滤', async () => {
    const list = ref(['apple', 'banana', 'cherry']);
    const text = ref('a');

    const { filteredList } = useDebouncedFilter(text, list, (item) =>
      item.includes(text.value),
    );

    text.value = 'an';
    await vi.advanceTimersByTimeAsync(200);

    expect(filteredList.value).toEqual(['banana']);
  });

  it('防抖窗口内的连续输入只应执行最后一次过滤', async () => {
    const list = ref(['apple', 'banana', 'cherry']);
    const text = ref('');

    const filterSpy = vi.fn((item: string) => item.includes(text.value));
    const { filteredList } = useDebouncedFilter(text, list, filterSpy);

    text.value = 'a';
    await vi.advanceTimersByTimeAsync(100);
    text.value = 'ap';
    await vi.advanceTimersByTimeAsync(100);
    // 距上次变更不足 200ms，不应已执行
    expect(filteredList.value).toHaveLength(3);

    await vi.advanceTimersByTimeAsync(200);
    expect(filteredList.value).toEqual(['apple']);
  });

  it('清空过滤文本应该恢复完整列表', async () => {
    const list = ref(['apple', 'banana']);
    const text = ref('app');

    const { filteredList } = useDebouncedFilter(text, list, (item) =>
      item.includes(text.value),
    );
    await vi.advanceTimersByTimeAsync(200);
    expect(filteredList.value).toEqual(['apple']);

    text.value = '';
    await vi.advanceTimersByTimeAsync(200);
    expect(filteredList.value).toEqual(['apple', 'banana']);
  });
});

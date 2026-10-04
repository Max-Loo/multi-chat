import { ref, watch, onScopeDispose, toValue, type Ref, type MaybeRefOrGetter } from 'vue';
import { debounce } from 'es-toolkit';

/**
 * 带防抖的过滤组合式函数（转写自 React hooks/useDebouncedFilter）
 *
 * @param text 过滤文本（支持 ref/getter），用于匹配列表项的搜索关键字
 * @param list 原始数据列表（支持 ref/getter）
 * @param predicate 过滤条件函数，语义与 Array.filter 的谓词一致
 * @param debounceMs 防抖延迟时间，默认 200 毫秒
 * @returns 过滤后的列表（响应式）
 */
export function useDebouncedFilter<T>(
  text: MaybeRefOrGetter<string>,
  list: MaybeRefOrGetter<T[]>,
  predicate: (value: T, index: number, list: T[]) => unknown,
  debounceMs: number = 200,
) {
  /** 存储过滤后的列表状态（初始为完整列表，与原实现 useState(list) 语义一致） */
  const filteredList = ref<T[]>(toValue(list)) as Ref<T[]>;

  /** 执行过滤并更新结果 */
  const applyFilter = () => {
    const sourceList = toValue(list);
    const filterText = toValue(text);

    // 如果没有过滤文本，则显示完整的原始列表
    if (!filterText) {
      filteredList.value = sourceList;
    } else {
      // 根据谓词函数过滤列表，只保留满足条件的项
      filteredList.value = sourceList.filter(predicate);
    }
  };

  // 创建防抖过滤函数，避免在用户快速输入时频繁执行过滤操作
  const debouncedFilter = debounce(applyFilter, debounceMs);

  watch(
    [() => toValue(text), () => toValue(list)],
    () => {
      debouncedFilter();
    },
    // 立即执行一次防抖函数，与原实现首次同步过滤一致
    { immediate: true },
  );

  // 组件卸载时取消未执行的防抖调用
  onScopeDispose(() => {
    debouncedFilter.cancel();
  });

  return {
    /** 过滤后的列表数据 */
    filteredList,
  };
}

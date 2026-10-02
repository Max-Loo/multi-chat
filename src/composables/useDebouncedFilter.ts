/**
 * 带防抖的过滤组合式函数（对应旧版 components/FilterInput/hooks/useDebouncedFilter.ts）
 *
 * @param text 过滤文本（响应式）
 * @param list 原始数据列表（响应式）
 * @param predicate 过滤条件函数
 * @param debounceMs 防抖延迟，默认 200 毫秒
 */
import {
  ref,
  computed,
  watch,
  onScopeDispose,
  getCurrentScope,
  type ComputedRef,
  type Ref,
} from 'vue';
import { debounce } from 'es-toolkit';

export function useDebouncedFilter<T>(
  text: ComputedRef<string> | (() => string),
  list: ComputedRef<T[]> | (() => T[]),
  predicate: (value: T, index: number, list: T[]) => unknown,
  debounceMs = 200,
): { filteredList: ComputedRef<T[]> } {
  // 读取辅助
  const getText = (): string =>
    typeof text === 'function' ? text() : text.value;
  const getList = (): T[] => (typeof list === 'function' ? list() : list.value);

  // 存储过滤后的列表状态
  // 初始值为完整列表（与旧 React 版 useState(list) 对齐，避免首屏防抖窗口期内闪空）
  const filteredList = ref([...getList()]) as Ref<T[]>;

  // 创建防抖过滤函数，避免在用户快速输入时频繁执行过滤操作
  const debouncedFilter = debounce(() => {
    const currentText = getText();
    const currentList = getList();

    // 如果没有过滤文本，则显示完整的原始列表
    if (!currentText) {
      filteredList.value = currentList;
    } else {
      // 根据谓词函数过滤列表，只保留满足条件的项
      filteredList.value = currentList.filter((item, index, arr) =>
        predicate(item, index, arr),
      );
    }
  }, debounceMs);

  // 过滤文本或原始列表变化时重新执行防抖过滤
  watch(
    [
      typeof text === 'function' ? text : () => text.value,
      typeof list === 'function' ? list : () => list.value,
    ],
    () => {
      debouncedFilter();
    },
    { immediate: true },
  );

  // 作用域销毁时取消未执行的防抖函数
  if (getCurrentScope()) {
    onScopeDispose(() => {
      debouncedFilter.cancel();
    });
  }

  return {
    filteredList: computed(() => filteredList.value),
  };
}

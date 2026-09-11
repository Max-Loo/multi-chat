import { ref, watch, type Ref } from 'vue';
import { debounce } from 'es-toolkit';

/**
 * 带防抖的过滤组合式函数（Vue 版 useDebouncedFilter）
 *
 * @param text 过滤文本（响应式引用）
 * @param list 原始数据列表（响应式引用）
 * @param predicate 过滤条件函数
 * @param debounceMs 防抖延迟时间，默认 200 毫秒
 */
export const useDebouncedFilter = <T>(
  text: Ref<string>,
  list: Ref<T[]>,
  predicate: (value: T, index: number, list: T[]) => unknown,
  debounceMs = 200,
) => {
  // 存储过滤后的列表状态
  const filteredList = ref<T[]>(list.value) as Ref<T[]>;

  watch(
    [text, list],
    () => {
      // 创建防抖过滤函数，避免在用户快速输入时频繁执行过滤操作
      const debouncedFilter = debounce(() => {
        // 如果没有过滤文本，则显示完整的原始列表
        if (!text.value) {
          filteredList.value = list.value;
        } else {
          // 根据谓词函数过滤列表，只保留满足条件的项
          filteredList.value = list.value.filter((v, i, arr) => predicate(v, i, arr));
        }
      }, debounceMs);

      // 立即执行一次防抖函数
      debouncedFilter();

      // 依赖项变化或作用域销毁时取消未执行的防抖函数
      return () => {
        debouncedFilter.cancel();
      };
    },
    { immediate: true },
  );

  return {
    filteredList,
  };
};

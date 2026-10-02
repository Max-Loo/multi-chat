/**
 * 防抖组合式函数（对应旧版 hooks/useDebounce.ts）
 *
 * @param value 需要防抖的值（响应式）
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值（computed）
 */
import { ref, watch, computed, type ComputedRef, type Ref } from 'vue';

export function useDebounce<T>(
  value: ComputedRef<T> | (() => T),
  delay: number,
): ComputedRef<T> {
  const getValue = (): T =>
    typeof value === 'function' ? (value as () => T)() : value.value;
  const debouncedValue: Ref<T> = ref(getValue()) as Ref<T>;

  watch(getValue, (newValue) => {
    // 定时器：延迟同步最新值
    setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return computed(() => debouncedValue.value);
}

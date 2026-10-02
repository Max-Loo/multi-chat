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

  // 待触发的定时器句柄：新变化到来时取消上一次（防抖语义，与旧 React 版 cleanup 对齐）
  let timerId: ReturnType<typeof setTimeout> | null = null;

  watch(getValue, (newValue) => {
    // 取消上一次未触发的定时器，仅保留最后一次变化
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      debouncedValue.value = newValue;
      timerId = null;
    }, delay);
  });

  return computed(() => debouncedValue.value);
}

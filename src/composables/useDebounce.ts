/**
 * 防抖组合式函数（转写自 React hooks/useDebounce）
 *
 * @param value 需要防抖的值（响应式）
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
import { ref, watch, toValue, type Ref, type MaybeRefOrGetter } from 'vue';

export function useDebounce<T>(
  value: MaybeRefOrGetter<T>,
  delay: number,
): Ref<T> {
  const debouncedValue = ref(toValue(value)) as Ref<T>;

  watch(
    () => toValue(value),
    (newValue, _oldValue, onCleanup) => {
      // 设置定时器
      const handler = setTimeout(() => {
        debouncedValue.value = newValue;
      }, delay);

      // 清除函数：在 value 或 delay 改变时取消之前的定时器
      onCleanup(() => {
        clearTimeout(handler);
      });
    },
    { immediate: true },
  );

  return debouncedValue;
}

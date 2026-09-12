import { ref, watch, type Ref } from 'vue';

/**
 * 防抖组合式函数（Vue 版 useDebounce）
 * @param value 需要防抖的响应式源
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的只读响应式引用（初始值立即生效，后续变更延迟同步）
 */
export function useDebounce<T>(value: Ref<T>, delay: number): Readonly<Ref<T>> {
  const debouncedValue = ref(value.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(value, (newVal) => {
    // 在 value 或 delay 变化时取消之前的定时器
    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      debouncedValue.value = newVal;
    }, delay);
  });

  return debouncedValue;
}

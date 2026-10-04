/**
 * 自适应滚动条组合式函数（转写自 React hooks/useAdaptiveScrollbar）
 *
 * 滚动时展示滚动条，停止滚动后延迟隐藏
 */
import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue';

/** 组合式函数入参 */
interface UseAdaptiveScrollbarParams {
  /** 隐藏防抖延迟（毫秒），默认 500 */
  hideDebounceMs?: number;
}

/**
 * 处理自适应滚动条的逻辑
 * @returns scrollbarClassname 控制滚动条样式的类名
 * @returns onScrollEvent 触发滚动事件
 * @returns isScrolling 是否处于滚动中
 */
export function useAdaptiveScrollbar({
  hideDebounceMs = 500,
}: UseAdaptiveScrollbarParams = {}): {
  scrollbarClassname: ComputedRef<string>;
  onScrollEvent: () => void;
  isScrolling: Ref<boolean>;
} {
  // 控制当前是否滚动
  const isScrolling = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * 在滚动的时候展示滚动条并重新计时
   */
  function showScrollbar(): void {
    isScrolling.value = true;

    // 如果上一个计时器还没有执行就清除它
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // 重新开始计时
    timeoutId = setTimeout(() => {
      isScrolling.value = false;
    }, hideDebounceMs);
  }

  // 由类名来控制是否展示滚动条
  const scrollbarClassname = computed(() =>
    isScrolling.value ? 'scrollbar-thin' : 'scrollbar-none',
  );

  // 作用域销毁时清理计时器
  onScopeDispose(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return {
    scrollbarClassname,
    isScrolling,
    onScrollEvent: showScrollbar,
  };
}

import { computed, ref } from 'vue';

/**
 * 处理自适应滚动条的组合式函数（Vue 版 useAdaptiveScrollbar）
 * 滚动时展示滚动条，停止 500ms 后隐藏
 */
export const useAdaptiveScrollbar = ({ hideDebounceMs = 500 }: { hideDebounceMs?: number } = {}) => {
  // 控制当前是否滚动
  const isScrolling = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // 在滚动的时候展示滚动条
  const showScrollbar = () => {
    isScrolling.value = true;

    // 如果上一个计时器还没有执行，清除它
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // 重新开始计时
    timeoutId = setTimeout(() => {
      isScrolling.value = false;
    }, hideDebounceMs);
  };

  // 由类名来控制是否展示滚动条
  const scrollbarClassname = computed(() => (isScrolling.value ? 'scrollbar-thin' : 'scrollbar-none'));

  return {
    scrollbarClassname,
    isScrolling,
    onScrollEvent: showScrollbar,
  };
};

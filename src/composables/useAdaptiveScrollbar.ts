/**
 * 自适应滚动条组合式函数（对应旧版 hooks/useAdaptiveScrollbar.ts）
 *
 * 滚动时展示滚动条，停止滚动（防抖）后隐藏。
 */
import {
  ref,
  computed,
  onScopeDispose,
  getCurrentScope,
  type Ref,
  type ComputedRef,
} from 'vue';
import { isNull } from 'es-toolkit';

/** 参数选项 */
interface UseAdaptiveScrollbarOptions {
  /** 隐藏防抖延迟（毫秒） */
  hideDebounceMs?: number;
}

/** 返回值 */
export interface UseAdaptiveScrollbarResult {
  /** 控制滚动条样式的类名 */
  scrollbarClassname: ComputedRef<string>;
  /** 触发滚动事件（滚动时调用） */
  onScrollEvent: () => void;
  /** 是否处于滚动中 */
  isScrolling: Ref<boolean>;
}

/**
 * 处理自适应滚动条的逻辑
 */
export const useAdaptiveScrollbar = (
  options: UseAdaptiveScrollbarOptions = {},
): UseAdaptiveScrollbarResult => {
  const { hideDebounceMs = 500 } = options;

  // 控制当前是否滚动
  const isScrolling = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  /** 在滚动的时候展示滚动条 */
  const showScrollbar = (): void => {
    isScrolling.value = true;

    // 如果上一个计时器还没有执行的话，清除上一个计时器
    if (!isNull(timeoutId)) {
      clearTimeout(timeoutId);
    }

    // 重新开始计时
    timeoutId = setTimeout(() => {
      isScrolling.value = false;
    }, hideDebounceMs);
  };

  // 作用域销毁时清理计时器
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (!isNull(timeoutId)) {
        clearTimeout(timeoutId);
      }
    });
  }

  // 由类名来控制是否展示滚动条
  const scrollbarClassname = computed(() =>
    isScrolling.value ? 'scrollbar-thin' : 'scrollbar-none',
  );

  return {
    scrollbarClassname,
    isScrolling,
    onScrollEvent: showScrollbar,
  };
};

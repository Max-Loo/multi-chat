/**
 * 自适应滚动容器组合式函数（转写自 React hooks/useScrollContainer）
 *
 * 封装 ref + 滚动事件监听 + 滚动条样式切换
 */
import { ref, type Ref } from 'vue';
import { useAdaptiveScrollbar } from './useAdaptiveScrollbar';

/**
 * @returns scrollContainerRef 绑定到滚动容器 div 的 ref
 * @returns scrollbarClassname 加入容器 className
 * @returns onScrollEvent 滚动事件回调（供 @scroll 使用）
 */
export function useScrollContainer(): {
  scrollContainerRef: Ref<HTMLDivElement | null>;
  scrollbarClassname: ReturnType<typeof useAdaptiveScrollbar>['scrollbarClassname'];
  onScrollEvent: () => void;
} {
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();
  const scrollContainerRef = ref<HTMLDivElement | null>(null);

  // 滚动事件经模板 @scroll 绑定（浏览器对滚动监听默认 passive 处理）
  return { scrollContainerRef, scrollbarClassname, onScrollEvent };
}

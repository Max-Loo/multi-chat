/**
 * 封装自适应滚动容器的完整逻辑（对应旧版 hooks/useScrollContainer.ts）
 *
 * @returns scrollContainerRef 绑定到滚动容器 div 的 ref，scrollbarClassname 加入容器类名
 */
import {
  ref,
  onMounted,
  onUnmounted,
  type ComputedRef,
  type Ref,
} from 'vue';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

export const useScrollContainer = (): {
  scrollContainerRef: Ref<HTMLDivElement | null>;
  scrollbarClassname: ComputedRef<string>;
} => {
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();
  const scrollContainerRef = ref<HTMLDivElement | null>(null);

  // 添加 passive 监听器
  onMounted(() => {
    const container = scrollContainerRef.value;
    if (!container) return;
    container.addEventListener('scroll', onScrollEvent, { passive: true });
  });

  onUnmounted(() => {
    const container = scrollContainerRef.value;
    if (!container) return;
    container.removeEventListener('scroll', onScrollEvent);
  });

  return { scrollContainerRef, scrollbarClassname };
};

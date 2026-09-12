import { onMounted, onUnmounted, ref } from 'vue';
import { useAdaptiveScrollbar } from './useAdaptiveScrollbar';

/**
 * 封装自适应滚动容器的完整逻辑（Vue 版 useScrollContainer）
 * 组件挂载后自动以 passive 方式监听滚动事件，卸载时清理
 * @returns scrollContainerRef 绑定到滚动容器 div 的模板 ref，scrollbarClassname 加入容器 className
 */
export const useScrollContainer = () => {
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();
  const scrollContainerRef = ref<HTMLElement | null>(null);

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

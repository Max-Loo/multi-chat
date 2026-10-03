import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';

export type LayoutMode = 'mobile' | 'compact' | 'compressed' | 'desktop';

/**
 * 响应式布局组合式函数
 * 转写自 React hooks/useResponsive，断点与行为保持一致
 */
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isCompact = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isCompressed = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isDesktop = useMediaQuery('(min-width: 1280px)');

  const layoutMode = computed<LayoutMode>(() =>
    isMobile.value
      ? 'mobile'
      : isCompact.value
        ? 'compact'
        : isCompressed.value
          ? 'compressed'
          : 'desktop',
  );

  return {
    layoutMode,
    width: typeof window !== 'undefined' ? window.innerWidth : undefined,
    height: typeof window !== 'undefined' ? window.innerHeight : undefined,
    isMobile,
    isCompact,
    isCompressed,
    isDesktop,
  };
}

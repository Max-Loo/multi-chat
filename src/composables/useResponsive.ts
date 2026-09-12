import { computed } from 'vue';
import { useMediaQuery } from './useMediaQuery';

/** 布局模式 */
export type LayoutMode = 'mobile' | 'compact' | 'compressed' | 'desktop';

/**
 * 响应式布局组合式函数（Vue 版 useResponsive）
 * 断点与 迁移前保持一致：mobile <768、compact 768-1023、compressed 1024-1279、desktop ≥1280
 */
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 767px)', false);
  const isCompact = useMediaQuery('(min-width: 768px) and (max-width: 1023px)', false);
  const isCompressed = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)', false);
  const isDesktop = useMediaQuery('(min-width: 1280px)', true);

  const layoutMode = computed<LayoutMode>(() =>
    isMobile.value ? 'mobile' : isCompact.value ? 'compact' : isCompressed.value ? 'compressed' : 'desktop',
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

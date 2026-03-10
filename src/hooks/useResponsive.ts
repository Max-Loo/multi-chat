import { useMediaQuery } from './useMediaQuery';

export type LayoutMode = 'mobile' | 'compact' | 'compressed' | 'desktop';

export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 767px)', false);
  const isCompact = useMediaQuery('(min-width: 768px) and (max-width: 1023px)', false);
  const isCompressed = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)', false);
  const isDesktop = useMediaQuery('(min-width: 1280px)', true);

  const layoutMode: LayoutMode = isMobile
    ? 'mobile'
    : isCompact
      ? 'compact'
      : isCompressed
        ? 'compressed'
        : 'desktop';

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

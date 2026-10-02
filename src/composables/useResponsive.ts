/**
 * 响应式布局 Vue 组合式函数（对应旧版 hooks/useResponsive.ts）
 *
 * 按断点划分四种布局模式：mobile(<768) / compact(768-1023) / compressed(1024-1279) / desktop(>=1280)
 */
import { computed, type ComputedRef, type Ref } from 'vue';
import { useMediaQuery } from './useMediaQuery';

/** 布局模式类型 */
export type LayoutMode = 'mobile' | 'compact' | 'compressed' | 'desktop';

/** useResponsive 返回值 */
export interface UseResponsiveResult {
  /** 当前布局模式 */
  layoutMode: ComputedRef<LayoutMode>;
  /** 窗口宽度（非响应式快照） */
  width: number | undefined;
  /** 窗口高度（非响应式快照） */
  height: number | undefined;
  /** 是否移动端（<768px） */
  isMobile: Ref<boolean>;
  /** 是否紧凑布局（768-1023px） */
  isCompact: Ref<boolean>;
  /** 是否压缩布局（1024-1279px） */
  isCompressed: Ref<boolean>;
  /** 是否桌面布局（>=1280px） */
  isDesktop: Ref<boolean>;
}

/**
 * 获取响应式布局状态
 *
 * @returns 各断点的响应式标志与派生的布局模式
 */
export function useResponsive(): UseResponsiveResult {
  const isMobile = useMediaQuery('(max-width: 767px)', false);
  const isCompact = useMediaQuery(
    '(min-width: 768px) and (max-width: 1023px)',
    false,
  );
  const isCompressed = useMediaQuery(
    '(min-width: 1024px) and (max-width: 1279px)',
    false,
  );
  const isDesktop = useMediaQuery('(min-width: 1280px)', true);

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

import { computed, onScopeDispose, ref, type Ref } from 'vue';

export type LayoutMode = 'mobile' | 'compact' | 'compressed' | 'desktop';

/**
 * 自维护的媒体查询组合式函数
 *
 * 依赖 matchMedia change 事件响应变化；部分嵌入式环境（如浏览器内嵌视口仿真）
 * 不派发 change/resize 事件，挂载后做少量延迟重同步以修正初始状态
 * @param query 媒体查询字符串
 * @returns 是否匹配（响应式）
 */
function useMediaQuerySync(query: string): Ref<boolean> {
  const mql = window.matchMedia(query);
  const matches = ref(mql.matches);

  /** 重新求值当前匹配状态 */
  const update = () => {
    matches.value = mql.matches;
  };

  // change 事件监听（真实浏览器视口变化时触发）
  mql.addEventListener('change', update);

  // 挂载后延迟重同步（覆盖视口仿真等不派发事件的环境）
  const resyncTimers: number[] = [50, 200, 600].map((delay) =>
    window.setTimeout(update, delay),
  );

  onScopeDispose(() => {
    mql.removeEventListener('change', update);
    resyncTimers.forEach((timer) => window.clearTimeout(timer));
  });

  return matches;
}

/**
 * 响应式布局组合式函数
 * 转写自 React hooks/useResponsive，断点与行为保持一致
 */
export function useResponsive() {
  const isMobile = useMediaQuerySync('(max-width: 767px)');
  const isCompact = useMediaQuerySync('(min-width: 768px) and (max-width: 1023px)');
  const isCompressed = useMediaQuerySync('(min-width: 1024px) and (max-width: 1279px)');
  const isDesktop = useMediaQuerySync('(min-width: 1280px)');

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

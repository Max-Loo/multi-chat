import { computed } from "vue";
import { useMediaQuery } from "./useMediaQuery";

export type LayoutMode = "mobile" | "compact" | "compressed" | "desktop";

/**
 * 响应式布局 Composable（对应原 hooks/useResponsive.tsx）
 *
 * @returns 各断点匹配状态与当前布局模式
 */
export function useResponsive() {
  const isMobile = useMediaQuery("(max-width: 767px)", false);
  const isCompact = useMediaQuery(
    "(min-width: 768px) and (max-width: 1023px)",
    false,
  );
  const isCompressed = useMediaQuery(
    "(min-width: 1024px) and (max-width: 1279px)",
    false,
  );
  const isDesktop = useMediaQuery("(min-width: 1280px)", true);

  const layoutMode = computed<LayoutMode>(() =>
    isMobile.value
      ? "mobile"
      : isCompact.value
        ? "compact"
        : isCompressed.value
          ? "compressed"
          : "desktop",
  );

  return {
    layoutMode,
    width: typeof window !== "undefined" ? window.innerWidth : undefined,
    height: typeof window !== "undefined" ? window.innerHeight : undefined,
    isMobile,
    isCompact,
    isCompressed,
    isDesktop,
  };
}

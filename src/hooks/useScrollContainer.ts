import { useEffect, useRef } from "react";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";

/**
 * 封装自适应滚动容器的完整逻辑（ref + 滚动事件监听 + 样式切换）
 * @returns scrollContainerRef 绑定到滚动容器 div 的 ref，scrollbarClassname 加入容器 className
 */
export const useScrollContainer = () => {
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScrollEvent, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScrollEvent);
    };
  }, [onScrollEvent]);

  return { scrollContainerRef, scrollbarClassname };
};

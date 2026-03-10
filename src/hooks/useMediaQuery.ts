import { useState, useEffect, useRef } from 'react';
import { throttle } from 'es-toolkit';

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  });

  // 使用 ref 保存节流处理器，避免每次 effect 重新创建
  const throttledHandlerRef = useRef<
    ((event: MediaQueryListEvent) => void) | null
  >(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // 创建节流处理器（150ms）
    if (!throttledHandlerRef.current) {
      // 使用 es-toolkit 的 throttle 函数
      // leading: true - 立即响应第一次变化
      // trailing: true - 在节流间隔结束后也执行最后一次变化
      throttledHandlerRef.current = throttle((event: MediaQueryListEvent) => {
        setMatches(event.matches);
      }, 150);
    }

    mediaQuery.addEventListener('change', throttledHandlerRef.current);

    return () => {
      mediaQuery.removeEventListener('change', throttledHandlerRef.current!);
    };
  }, [query]);

  return matches;
}

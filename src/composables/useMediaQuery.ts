import { ref, watchEffect, type Ref } from "vue";
import { throttle } from "es-toolkit";

/**
 * 媒体查询 Composable（对应原 hooks/useMediaQuery.tsx）
 *
 * @param query 媒体查询表达式（如 '(max-width: 767px)'）
 * @param defaultValue SSR/无 window 环境下的默认值
 * @returns 是否匹配（响应式）
 */
export function useMediaQuery(
  query: string,
  defaultValue = false,
): Ref<boolean> {
  const matches = ref<boolean>(
    typeof window === "undefined"
      ? defaultValue
      : window.matchMedia(query).matches,
  );

  watchEffect((onCleanup) => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // 创建节流处理器（150ms）
    // leading: true - 立即响应第一次变化
    // trailing: true - 在节流间隔结束后也执行最后一次变化
    const throttledHandler = throttle((event: MediaQueryListEvent) => {
      matches.value = event.matches;
    }, 150);

    mediaQuery.addEventListener("change", throttledHandler);

    onCleanup(() => {
      mediaQuery.removeEventListener("change", throttledHandler);
    });
  });

  return matches;
}

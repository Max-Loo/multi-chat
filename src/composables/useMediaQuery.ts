import { ref, onScopeDispose } from 'vue';
import { throttle } from 'es-toolkit';

/**
 * 媒体查询组合式函数（Vue 版 useMediaQuery）
 *
 * @param query 媒体查询表达式
 * @param defaultValue SSR/无窗口环境的默认值
 * @returns 响应式的匹配状态
 */
export function useMediaQuery(query: string, defaultValue = false) {
  const matches = ref(
    typeof window === 'undefined' ? defaultValue : window.matchMedia(query).matches,
  );

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia(query);

    // 节流处理器（150ms），leading/trailing 均生效，与 迁移前一致
    const throttledHandler = throttle((event: MediaQueryListEvent) => {
      matches.value = event.matches;
    }, 150);

    mediaQuery.addEventListener('change', throttledHandler);

    // 作用域销毁时移除监听
    onScopeDispose(() => {
      mediaQuery.removeEventListener('change', throttledHandler);
    });
  }

  return matches;
}

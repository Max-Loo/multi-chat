/**
 * 媒体查询 Vue 组合式函数（对应旧版 hooks/useMediaQuery.ts）
 *
 * 返回响应式的 matches 状态，查询条件变化（节流 150ms）时自动更新。
 */
import {
  ref,
  watch,
  onScopeDispose,
  getCurrentScope,
  type Ref,
} from 'vue';
import { throttle } from 'es-toolkit';

/**
 * 监听媒体查询条件
 *
 * @param query CSS 媒体查询条件（响应式）
 * @param defaultValue SSR/无 window 环境的默认值
 * @returns 是否匹配的响应式 ref
 */
export function useMediaQuery(
  query: string | Ref<string>,
  defaultValue = false,
): Ref<boolean> {
  const getQuery = (): string =>
    typeof query === 'string' ? query : query.value;

  const matches = ref<boolean>(
    typeof window === 'undefined'
      ? defaultValue
      : window.matchMedia(getQuery()).matches,
  );

  // 节流处理器（150ms，leading + trailing）
  const throttledHandler = throttle((event: MediaQueryListEvent) => {
    matches.value = event.matches;
  }, 150);

  /** 绑定当前查询，返回解绑函数 */
  const bind = (): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    const mq = window.matchMedia(getQuery());
    mq.addEventListener('change', throttledHandler);
    return () => {
      mq.removeEventListener('change', throttledHandler);
    };
  };

  let unbind = bind();

  // 查询条件变化时重新绑定
  watch(
    typeof query === 'string' ? () => query : query,
    () => {
      unbind();
      matches.value =
        typeof window === 'undefined'
          ? defaultValue
          : window.matchMedia(getQuery()).matches;
      unbind = bind();
    },
  );

  // 作用域销毁时解绑
  if (getCurrentScope()) {
    onScopeDispose(() => {
      unbind();
    });
  }

  return matches;
}

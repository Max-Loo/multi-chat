/**
 * 页面导航组合式函数（对应旧版 hooks/useNavigateToPage.ts，vue-router 实现）
 */
import { useRouter, useRoute, type RouteLocationRaw } from 'vue-router';
import type { LocationQueryRaw } from 'vue-router';
import { clearUrlSearchParams } from '@/utils/urlUtils';

/** 导航到聊天页的选项 */
export interface NavigateToChatOptions {
  /** 目标聊天 ID（提供时写入 URL query） */
  chatId?: string;
  /** 是否以 replace 方式导航（不留下历史记录） */
  replace?: boolean;
  /** 传递的 history state */
  state?: Record<string | number | symbol, unknown>;
}

/**
 * 导航到聊天页面（带 chatId 参数）
 *
 * @example
 * ```ts
 * const { navigateToChat, clearChatIdParam } = useNavigateToChat();
 * navigateToChat({ chatId: 'abc' });
 * ```
 */
export const useNavigateToChat = () => {
  const router = useRouter();
  const route = useRoute();

  /**
   * 跳转到聊天页
   */
  const navigateToChat = ({
    chatId,
    replace = false,
    state,
  }: NavigateToChatOptions = {}) => {
    const target: RouteLocationRaw = {
      path: '/chat',
      query: chatId ? { chatId } : undefined,
      // vue-router 内部 HistoryState 类型未导出，此处局部收敛
      state: state as never,
    };
    if (replace) {
      void router.replace(target);
    } else {
      void router.push(target);
    }
  };

  /**
   * 清除 URL 中的 chatId 参数
   */
  const clearChatIdParam = () => {
    const searchParams = new URLSearchParams(
      route.query as Record<string, string>,
    );
    const newParams = clearUrlSearchParams(['chatId'], searchParams);
    void router.replace({
      query: Object.fromEntries(newParams) as LocationQueryRaw,
    });
  };

  return {
    navigateToChat,
    clearChatIdParam,
  };
};

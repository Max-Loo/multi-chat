/**
 * 页面导航组合式函数（转写自 React hooks/useNavigateToPage）
 *
 * 提供跳转到聊天页面（带 chatId 参数）与清除 URL 参数的能力
 */
import { useRouter, useRoute } from 'vue-router';
import { clearUrlSearchParams } from '@/utils/urlUtils';

/** 跳转到聊天页的选项 */
export interface NavigateToChatOptions {
  /** 目标聊天 ID；缺省时跳转到不带参数的 /chat */
  chatId?: string;
}

/**
 * 聊天页导航组合式函数
 * @returns navigateToChat 跳转函数与 clearChatIdParam 参数清理函数
 */
export function useNavigateToChat() {
  const router = useRouter();
  const route = useRoute();

  /**
   * 跳转到聊天页面（可携带 chatId 查询参数）
   * @param options 跳转选项
   */
  const navigateToChat = (options: NavigateToChatOptions = {}) => {
    const query = options.chatId ? { chatId: options.chatId } : undefined;
    router.push({ path: '/chat', query });
  };

  /**
   * 清除 URL 中的 chatId 参数（保留其余查询参数）
   */
  const clearChatIdParam = () => {
    const searchParams = new URLSearchParams(
      route.query as Record<string, string>,
    );
    const newParams = clearUrlSearchParams(['chatId'], searchParams);
    router.replace({ query: Object.fromEntries(newParams.entries()) });
  };

  return {
    navigateToChat,
    clearChatIdParam,
  };
}

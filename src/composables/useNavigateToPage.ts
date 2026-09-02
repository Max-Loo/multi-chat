/**
 * @description 页面导航 composables（对应原 hooks/useNavigateToPage.tsx）
 */
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router";

/**
 * 跳转到聊天页面的选项
 */
interface NavigateToChatOptions {
  /** 目标聊天 ID（可选） */
  chatId?: string;
  /** 是否替换当前历史记录 */
  replace?: boolean;
}

/**
 * 聊天页面导航 composable
 * 处理「带 chatId 参数跳转」与「清除 URL 中的 chatId 参数」
 */
export function useNavigateToChat() {
  const router = useRouter();
  const route = useRoute();

  /**
   * 跳转到聊天页面（可携带 chatId 查询参数）
   */
  function navigateToChat(options: NavigateToChatOptions = {}): void {
    const { chatId, replace } = options;
    void router.push({
      path: "/chat",
      query: chatId ? { chatId } : {},
      replace,
    });
  }

  /**
   * 清除 URL 中的 chatId 参数
   */
  function clearChatIdParam(): void {
    const query: Record<string, unknown> = { ...route.query };
    delete query.chatId;
    void router.replace({ query: query as LocationQueryRaw });
  }

  return {
    navigateToChat,
    clearChatIdParam,
  };
}

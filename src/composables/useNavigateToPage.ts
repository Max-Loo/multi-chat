/**
 * 跳转到聊天页面组合式函数（Vue 版 useNavigateToChat）
 * 带 chatId 查询参数的导航，与 React 版行为一致
 */
import { useRouter, useRoute } from 'vue-router';

interface NavigateToChatOptions {
  chatId?: string;
  replace?: boolean;
}

export const useNavigateToChat = () => {
  const router = useRouter();
  const route = useRoute();

  const navigateToChat = ({ chatId, replace }: NavigateToChatOptions = {}) => {
    const navigate = replace ? router.replace : router.push;
    if (chatId) {
      void navigate({ path: '/chat', query: { chatId } });
    } else {
      void navigate({ path: '/chat' });
    }
  };

  /**
   * 清除 URL 中的 chatId 参数
   */
  const clearChatIdParam = () => {
    const query = { ...route.query };
    delete query.chatId;
    void router.replace({ path: route.path, query });
  };

  return {
    navigateToChat,
    clearChatIdParam,
  };
};

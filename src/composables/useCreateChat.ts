/**
 * 创建新聊天组合式函数（转写自 React hooks/useCreateChat）
 */
import { generateId } from 'ai';
import { useChatStore } from '@/store/chat';
import { useNavigateToChat } from '@/composables/useNavigateToPage';

/**
 * 创建新聊天并跳转
 * @returns createNewChat 创建函数
 */
export function useCreateChat() {
  const chatStore = useChatStore();
  const { navigateToChat } = useNavigateToChat();

  /**
   * 创建新的聊天并跳转到该聊天
   */
  async function createNewChat(): Promise<void> {
    const chat = {
      id: generateId(),
      name: '',
    };

    await chatStore.createChat({ chat });
    chatStore.setSelectedChatId(chat.id);
    navigateToChat({ chatId: chat.id });
  }

  return { createNewChat };
}

/**
 * 创建新聊天组合式函数（对应旧版 hooks/useCreateChat.ts）
 */
import { useChatStore } from '@/stores';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { generateId } from 'ai';

/**
 * 创建新聊天的组合式函数
 */
export const useCreateChat = () => {
  const chatStore = useChatStore();
  const { navigateToChat } = useNavigateToChat();

  /**
   * 创建新的聊天并跳转
   */
  const createNewChat = async (): Promise<void> => {
    const chat = {
      id: generateId(),
      name: '',
    };

    chatStore.createChat(chat);
    chatStore.setSelectedChatId(chat.id);
    navigateToChat({
      chatId: chat.id,
    });
  };

  return { createNewChat };
};

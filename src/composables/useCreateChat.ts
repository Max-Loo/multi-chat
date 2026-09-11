import { useChatStore } from '@/store/pinia/chat';
import { useNavigateToChat } from './useNavigateToPage';
import { generateId } from 'ai';

/**
 * 创建新聊天的组合式函数（Vue 版 useCreateChat）
 */
export const useCreateChat = () => {
  const chatStore = useChatStore();
  const { navigateToChat } = useNavigateToChat();

  /**
   * 创建新的聊天并跳转
   */
  const createNewChat = async () => {
    const chat = {
      id: generateId(),
      name: '',
    };

    await chatStore.createChat({ chat });
    chatStore.setSelectedChatId(chat.id);
    navigateToChat({ chatId: chat.id });
  };

  return { createNewChat };
};

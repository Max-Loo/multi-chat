/**
 * 聊天页选中聊天组合式函数（转写自 React pages/Chat/hooks/useSelectedChat）
 */
import { computed, type ComputedRef } from 'vue';
import type { Chat, ChatModel } from '@/types/chat';
import { useSelectedChat as useStoreSelectedChat } from '@/store/selectors/chatSelectors';

/**
 * 获取当前选中的聊天及其模型列表
 * @returns selectedChat 当前选中的聊天（可能为 undefined）
 * @returns chatModelList 当前聊天的模型列表
 */
export function useChatPageSelectedChat(): {
  selectedChat: ComputedRef<Chat | undefined>;
  chatModelList: ComputedRef<ChatModel[]>;
} {
  const selectedChat = useStoreSelectedChat();

  const chatModelList = computed<ChatModel[]>(() => {
    const chat = selectedChat.value;
    if (!chat) {
      return [];
    }
    return chat.chatModelList || [];
  });

  return {
    selectedChat,
    chatModelList,
  };
}

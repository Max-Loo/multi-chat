import { computed } from 'vue';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import type { Chat, ChatModel } from '@/types/chat';

/**
 * 获取当前选中的聊天及其模型列表（Vue 版 useSelectedChat）
 */
export const useSelectedChat = () => {
  const selectedChat = useCurrentSelectedChat();

  const chatModelList = computed<ChatModel[]>(() => {
    if (!selectedChat.value) {
      return [];
    }
    return selectedChat.value.chatModelList || [];
  });

  return {
    selectedChat: selectedChat as unknown as import('vue').ComputedRef<Chat | null>,
    chatModelList,
  };
};

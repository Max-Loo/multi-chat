import { computed } from 'vue';
import { useChatStore } from '@/store/pinia/chat';

/**
 * 获取当前选中的聊天（Vue 版 useCurrentSelectedChat）
 * 从 Pinia chat store 的 activeChatData 获取完整数据
 */
export const useCurrentSelectedChat = () => {
  const chatStore = useChatStore();

  const selectedChat = computed(() => {
    const id = chatStore.selectedChatId;
    return id ? chatStore.activeChatData[id] : undefined;
  });

  return computed(() => selectedChat.value ?? null);
};


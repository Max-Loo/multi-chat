import { computed } from 'vue';
import { useChatStore } from '@/store/pinia/chat';

/**
 * 获取活跃聊天的元数据列表（Vue 版 useExistingChatList，已过滤 isDeleted）
 */
export const useExistingChatList = () => {
  const chatStore = useChatStore();
  return computed(() => chatStore.chatMetaList);
};

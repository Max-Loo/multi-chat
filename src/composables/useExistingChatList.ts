/**
 * 活跃聊天元数据列表组合式函数（对应旧版 hooks/useExistingChatList.ts）
 */
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores';
import type { ChatMeta } from '@/types/chat';
import type { Ref } from 'vue';

/**
 * 获取活跃聊天的元数据列表（已过滤 isDeleted）
 */
export const useExistingChatList = (): Ref<ChatMeta[]> => {
  const chatStore = useChatStore();
  const { chatMetaList } = storeToRefs(chatStore);

  return chatMetaList;
};

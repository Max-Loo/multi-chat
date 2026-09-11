import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isNotNil } from 'es-toolkit';
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

/** 供需要「记忆上次查看的聊天」判断的调用方复用 */
export const isSelectedChatLoaded = (chat: ReturnType<typeof useCurrentSelectedChat>['value']) =>
  isNotNil(chat);

export { useRoute, useRouter };

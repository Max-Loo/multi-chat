/**
 * 当前选中聊天组合式函数（对应旧版 hooks/useCurrentSelectedChat.ts）
 *
 * 从 Pinia chatStore 的 activeChatData 中获取选中聊天的完整数据。
 */
import { computed, type ComputedRef } from 'vue';
import { useChatStore } from '@/stores';
import type { Chat } from '@/types/chat';

/**
 * 获取当前选中的聊天（响应式）
 *
 * @returns 选中聊天的 computed（未选中时为 null）
 */
export const useCurrentSelectedChat = (): ComputedRef<Chat | null> => {
  const chatStore = useChatStore();

  return computed(() => {
    const selectedChatId = chatStore.selectedChatId;
    if (!selectedChatId) return null;
    return chatStore.activeChatData[selectedChatId] ?? null;
  });
};

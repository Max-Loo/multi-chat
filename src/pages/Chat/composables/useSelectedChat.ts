/**
 * 获取当前选中的聊天及其模型列表（对应旧版 pages/Chat/hooks/useSelectedChat.ts）
 */
import { computed, type ComputedRef } from 'vue';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import type { Chat, ChatModel } from '@/types/chat';

/** 返回值 */
export interface UseSelectedChatResult {
  /** 当前选中的聊天（可能为 null） */
  selectedChat: ComputedRef<Chat | null>;
  /** 当前聊天的模型列表 */
  chatModelList: ComputedRef<ChatModel[]>;
}

/**
 * 获取当前选中的聊天及其模型列表
 */
export const useSelectedChat = (): UseSelectedChatResult => {
  const selectedChat = useCurrentSelectedChat();

  const chatModelList = computed<ChatModel[]>(() => {
    if (!selectedChat.value) {
      return [];
    }
    return selectedChat.value.chatModelList || [];
  });

  return {
    selectedChat,
    chatModelList,
  };
};

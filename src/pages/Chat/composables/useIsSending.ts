/**
 * 获取当前聊天是否处于发送状态（对应旧版 pages/Chat/hooks/useIsSending.ts）
 */
import { computed, type ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores';
import { useSelectedChat } from './useSelectedChat';

/**
 * 获取当前聊天是否处于发送状态
 */
export const useIsSending = (): { isSending: ComputedRef<boolean> } => {
  const chatStore = useChatStore();
  const { runningChat } = storeToRefs(chatStore);
  const { selectedChat } = useSelectedChat();

  // 当前选中聊天的运行数据
  const currentChatRunning = computed(() =>
    selectedChat.value
      ? runningChat.value[selectedChat.value.id]
      : undefined,
  );

  // 将每个独立窗口的发送状态汇总起来
  const isSending = computed(() => {
    if (!selectedChat.value) {
      return false;
    }
    if (!currentChatRunning.value) {
      return false;
    }
    return Object.values(currentChatRunning.value).some((item) => item.isSending);
  });

  return {
    isSending,
  };
};

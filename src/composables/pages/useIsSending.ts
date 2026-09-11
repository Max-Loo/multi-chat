import { computed } from 'vue';
import { isNil } from 'es-toolkit';
import { useChatStore } from '@/store/pinia/chat';
import { useSelectedChat } from './useSelectedChat';

/**
 * 获取当前聊天是否处于发送状态（Vue 版 useIsSending）
 */
export const useIsSending = () => {
  const chatStore = useChatStore();
  const { selectedChat } = useSelectedChat();

  // 将每个独立窗口的发送状态汇总起来
  const isSending = computed(() => {
    const current = selectedChat.value;
    if (isNil(current)) {
      return false;
    }

    const currentChatRunning = chatStore.runningChat[current.id];
    if (isNil(currentChatRunning)) {
      return false;
    }

    return Object.values(currentChatRunning).some((item) => item.isSending);
  });

  return { isSending };
};

/**
 * 聊天发送状态组合式函数（转写自 React pages/Chat/hooks/useIsSending）
 */
import { computed, type ComputedRef } from 'vue';
import { isNil } from 'es-toolkit';
import { useChatStore } from '@/store/chat';
import { useChatPageSelectedChat } from './useSelectedChat';

/**
 * 获取当前聊天是否处于发送状态
 * @returns isSending 是否处于发送状态（任一模型窗口发送中即为 true）
 */
export function useIsSending(): { isSending: ComputedRef<boolean> } {
  const chatStore = useChatStore();
  const { selectedChat } = useChatPageSelectedChat();

  const isSending = computed(() => {
    const chat = selectedChat.value;
    if (isNil(chat)) {
      return false;
    }

    // 当前选中聊天的运行数据
    const currentChatRunning = chatStore.runningChat[chat.id];
    if (isNil(currentChatRunning)) {
      return false;
    }

    // 汇总每个独立窗口的发送状态
    return Object.values(currentChatRunning).some((item) => item.isSending);
  });

  return { isSending };
}

import { computed } from "vue";
import { useChatStore } from "@/store/chat";
import type { ChatMeta } from "@/types/chat";

/**
 * 获取当前选中的聊天对象（从 activeChatData 中获取完整数据）
 * 转写自 Redux memoized selector selectSelectedChat，以 computed 提供缓存语义
 */
export function useSelectedChat() {
  const chatStore = useChatStore();

  return computed(() =>
    chatStore.selectedChatId
      ? chatStore.activeChatData[chatStore.selectedChatId]
      : undefined,
  );
}

/**
 * 获取活跃聊天元数据列表
 * 转写自 Redux memoized selector selectChatMetaList
 */
export function useChatMetaList() {
  const chatStore = useChatStore();

  return computed((): ChatMeta[] => chatStore.chatMetaList);
}

/**
 * 获取当前选中聊天的元数据
 * 转写自 Redux memoized selector selectSelectedChatMeta
 */
export function useSelectedChatMeta() {
  const chatStore = useChatStore();

  return computed(() =>
    chatStore.selectedChatId
      ? chatStore.chatMetaList.find(m => m.id === chatStore.selectedChatId)
      : undefined,
  );
}

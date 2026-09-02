import { computed } from "vue";
import { useChatStore } from "@/store/stores/chat";

/**
 * @description 获取当前选中的聊天（从 activeChatData 获取完整数据）
 * @returns 当前选中聊天（响应式，未选中时为 null）
 */
export function useCurrentSelectedChat() {
  const chatStore = useChatStore();

  const selectedChat = computed(() => chatStore.selectedChat ?? null);

  return selectedChat;
}

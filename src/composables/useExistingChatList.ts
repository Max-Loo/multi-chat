/**
 * 获取活跃聊天元数据列表组合式函数（转写自 React hooks/useExistingChatList）
 */
import type { ComputedRef } from 'vue';
import type { ChatMeta } from '@/types/chat';
import { useChatMetaList } from '@/store/selectors/chatSelectors';

/**
 * 获取活跃聊天的元数据列表（已过滤 isDeleted）
 */
export function useExistingChatList(): ComputedRef<ChatMeta[]> {
  return useChatMetaList();
}

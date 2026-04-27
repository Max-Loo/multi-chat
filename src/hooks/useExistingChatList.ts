import { useAppSelector } from "./redux"
import { selectChatMetaList } from "@/store/selectors/chatSelectors"
import type { ChatMeta } from "@/types/chat"

/**
 * @description 获取活跃聊天的元数据列表（已过滤 isDeleted）
 */
export const useExistingChatList = (): ChatMeta[] => {
  const chatMetaList = useAppSelector(selectChatMetaList)
  return chatMetaList
}
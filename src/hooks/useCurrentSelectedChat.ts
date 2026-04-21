import { useAppSelector } from "./redux"
import { selectSelectedChat } from "@/store/selectors/chatSelectors"

/**
 * @description 获取当前选中的聊天（从 activeChatData 获取完整数据）
 */
export const useCurrentSelectedChat = () => {
  const selectedChat = useAppSelector(selectSelectedChat)
  return selectedChat ?? null
}
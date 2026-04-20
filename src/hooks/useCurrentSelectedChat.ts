import { useAppSelector } from "./redux"
import { selectSelectedChat } from "@/store/selectors/chatSelectors"

/**
 * @description 获取当前选中的聊天（使用 memoized selector，只在选中 chat 引用真正变化时触发重渲染）
 */
export const useCurrentSelectedChat = () => {
  const selectedChat = useAppSelector(selectSelectedChat)
  return selectedChat ?? null
}

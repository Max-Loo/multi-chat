import { useMemo } from "react"
import { useAppSelector } from "./redux"

/**
 * @description 获取不包含删除了的聊天的 chatList
 */
export const useExistingChatList = () => {
  const chatList = useAppSelector(state => state.chat.chatList)

  return useMemo(() => {
    return chatList.filter(chat => {
      return !chat.isDeleted
    })
  }, [chatList])
}
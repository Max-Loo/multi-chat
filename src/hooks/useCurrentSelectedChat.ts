import { useMemo } from "react"
import { useAppSelector } from "./redux"
import { isNull } from "es-toolkit"
import { Chat } from "@/types/chat"

/**
 * @description 获取当前选中的聊天（因为全局记录的只是聊天ID，在这里转换成整个聊天实例）
 */
export const useCurrentSelectedChat = () => {
  const {
    selectedChatId,
    chatList,
  } = useAppSelector(state => state.chat)

  const selectedChat = useMemo(() => {
    if (isNull(selectedChatId)) {
      return null
    }

    return chatList.find(chat => chat.id === selectedChatId) as Chat
  }, [selectedChatId, chatList])

  return {
    selectedChat,
  }
}
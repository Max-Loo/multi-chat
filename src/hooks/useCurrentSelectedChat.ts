import { useMemo } from "react"
import { useAppSelector } from "./redux"
import { isNil } from "es-toolkit"
import { Chat } from "@/types/chat"

/**
 * @description 获取当前选中的聊天（因为全局记录的只是聊天ID，在这里转换成整个聊天实例）
 */
export const useCurrentSelectedChat = () => {
  const selectedChatId = useAppSelector(state => state.chat.selectedChatId)
  const chatList = useAppSelector(state => state.chat.chatList)

  const selectedChat = useMemo(() => {
    if (isNil(selectedChatId)) {
      return null
    }

    return chatList.find(chat => chat.id === selectedChatId) as Chat
  }, [selectedChatId, chatList])

  return selectedChat
}
import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { Chat, ChatModel } from "@/types/chat";
import { useMemo } from "react"

// 消除空值的「当前选中的聊天」
export const useTypedSelectedChat = (): {
  selectedChat: Chat;
  chatModelList: ChatModel[]
} => {
  const selectedChat = useCurrentSelectedChat()

  const typedSelectedChat = useMemo(() => {
    return selectedChat as Chat
  }, [selectedChat])

  const chatModelList = useMemo(() => {
    return typedSelectedChat.chatModelList || []
  }, [typedSelectedChat])

  return {
    selectedChat: typedSelectedChat,
    chatModelList,
  }
}
import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { Chat, ChatModel } from "@/types/chat";
import { useMemo } from "react"

// 消除空值的「当前选中的聊天」
export const useTypedSelectedChat = (): {
  selectedChat: Chat | null;
  chatModelList: ChatModel[]
} => {
  const selectedChat = useCurrentSelectedChat()

  // 统一返回 null 而不是 undefined
  const normalizedSelectedChat = useMemo(() => {
    return selectedChat ?? null
  }, [selectedChat])

  const chatModelList = useMemo(() => {
    if (!normalizedSelectedChat) {
      return []
    }
    return normalizedSelectedChat.chatModelList || []
  }, [normalizedSelectedChat])

  return {
    selectedChat: normalizedSelectedChat,
    chatModelList,
  }
}
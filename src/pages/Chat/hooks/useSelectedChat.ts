import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { Chat, ChatModel } from "@/types/chat";
import { useMemo } from "react"

/**
 * 获取当前选中的聊天及其模型列表
 * @returns selectedChat - 当前选中的聊天（可能为 null）
 * @returns chatModelList - 当前聊天的模型列表
 */
export const useSelectedChat = (): {
  selectedChat: Chat | null;
  chatModelList: ChatModel[]
} => {
  const selectedChat = useCurrentSelectedChat()

  const chatModelList = useMemo(() => {
    if (!selectedChat) {
      return []
    }
    return selectedChat.chatModelList || []
  }, [selectedChat])

  return {
    selectedChat,
    chatModelList,
  }
}

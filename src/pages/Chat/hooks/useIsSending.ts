import { useAppSelector } from "@/hooks/redux";
import { useSelectedChat } from "./useSelectedChat";
import { useMemo } from "react";
import { isNil } from "es-toolkit";

/**
 * 获取当前聊天是否处于发送状态
 * @returns isSending - 是否处于发送状态
 */
export const useIsSending = (): {
  isSending: boolean;
} => {
  const {
    selectedChat,
  } = useSelectedChat()


  // 当前在运行的聊天
  const runningChat = useAppSelector(state => state.chat.runningChat)

  // 将每个独立窗口的发送状态汇总起来
  const isSending = useMemo(() => {
    if (isNil(selectedChat)) {
      return false
    }

    const chat = runningChat[selectedChat.id]

    if (isNil(chat)) {
      return false
    }

    return Object.values(chat).some(item => item.isSending)

  }, [selectedChat, runningChat])

  return {
    isSending,
  }
}

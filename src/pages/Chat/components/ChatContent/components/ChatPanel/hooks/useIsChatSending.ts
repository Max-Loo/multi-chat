import { useAppSelector } from "@/hooks/redux";
import { useTypedSelectedChat } from "./useTypedSelectedChat";
import { useMemo } from "react";
import { isNil } from "es-toolkit";

export const useIsChatSending = (): {
  // 是否处于发送状态
  isSending: boolean;
} => {
  const {
    selectedChat,
  } = useTypedSelectedChat()


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
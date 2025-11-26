import { memo, useMemo } from "react";
import ChatBubble from "./ChatBubble";
import { useAppSelector } from "@/hooks/redux";
import { ChatModel } from "@/types/chat";
import { useTypedSelectedChat } from "../../../../../hooks/useTypedSelectedChat";
import { isNil } from "es-toolkit";
import { Bubble } from "@ant-design/x";

interface RunningChatBubbleProps {
  chatModel: ChatModel
}

/**
 * @description 封装正在生成的聊天气泡
 */
const RunningChatBubble = memo<RunningChatBubbleProps>(({
  chatModel,
}) => {
  const {
    selectedChat,
  } = useTypedSelectedChat()
  // 当前在运行的聊天
  const runningChat = useAppSelector(state => state.chat.runningChat)

  // 当前的某个聊天窗口
  const currentChatModel = useMemo(() => {
    return runningChat[selectedChat.id]?.[chatModel.modelId]
  }, [
    runningChat,
    selectedChat.id,
    chatModel.modelId,
  ])

  if (isNil(currentChatModel) || !currentChatModel.isSending) {
    return null
  }

  // 刚开始获取消息的状态，拦截并展示一个loading
  if (isNil(currentChatModel.history) || (!currentChatModel.history.content && !currentChatModel.history.reasoningContent)) {
    return <Bubble
      className="w-full mt-3"
      variant="borderless"
      placement="start" loading={true} content=""
    />
  }


  return <ChatBubble
    isRunningBubble={true}
    historyRecord={currentChatModel.history}
  />
})

export default RunningChatBubble
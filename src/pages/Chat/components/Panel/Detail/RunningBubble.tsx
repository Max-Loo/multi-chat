import { memo } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useAppSelector } from "@/hooks/redux";
import { ChatModel } from "@/types/chat";
import { useSelectedChat } from "@/pages/Chat/hooks/useSelectedChat";
import { isNil } from "es-toolkit";
import { Spinner } from "@/components/ui/spinner";

interface RunningBubbleProps {
  chatModel: ChatModel
}

/**
 * 封装正在生成的聊天气泡
 */
const RunningBubble = memo<RunningBubbleProps>(({
  chatModel,
}) => {
  const {
    selectedChat,
  } = useSelectedChat()

  // 精确订阅当前面板的 runningChat 数据，避免其他面板更新触发重渲染
  const chatData = useAppSelector(state => {
    const selectedChatId = selectedChat?.id
    return selectedChatId ? state.chat.runningChat[selectedChatId]?.[chatModel.modelId] : undefined
  })

  if (isNil(chatData) || !chatData.isSending) {
    return null
  }

  // 刚开始获取消息的状态，拦截并展示一个loading
  if (isNil(chatData.history) || (!chatData.history.content && !chatData.history.reasoningContent)) {
    return (
      <div className="w-full mt-3 flex justify-start">
        <div className="bg-muted text-muted-foreground px-4 py-3 rounded-lg flex items-center">
          <Spinner className="size-4" />
        </div>
      </div>
    )
  }

  // TypeScript 无法推断这里 history 一定存在，使用非空断言
  const history = chatData.history!

  return <ChatBubble
    role={history.role}
    content={history.content || ''}
    reasoningContent={history.reasoningContent}
    isRunning={true}
  />
})

export default RunningBubble
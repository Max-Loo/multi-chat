import { memo, useMemo } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useAppSelector } from "@/hooks/redux";
import { ChatModel } from "@/types/chat";
import { useTypedSelectedChat } from "../../../../../hooks/useTypedSelectedChat";
import { isNil } from "es-toolkit";
import { Spinner } from "@/components/ui/spinner";

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
  // 获取所有模型（用于查找 provider）
  const models = useAppSelector(state => state.models.models)

  // 🔧 提取嵌套访问，避免 useMemo 依赖数组复杂表达式
  const selectedChatId = selectedChat?.id
  const modelId = chatModel.modelId
  const chatData = selectedChatId ? runningChat[selectedChatId]?.[modelId] : undefined

  // 当前的某个聊天窗口
  const currentChatModel = useMemo(() => {
    return chatData
  }, [chatData])

  if (isNil(currentChatModel) || !currentChatModel.isSending) {
    return null
  }

  // 刚开始获取消息的状态，拦截并展示一个loading
  if (isNil(currentChatModel.history) || (!currentChatModel.history.content && !currentChatModel.history.reasoningContent)) {
    return (
      <div className="w-full mt-3 flex justify-start">
        <div className="bg-muted text-muted-foreground px-4 py-3 rounded-lg flex items-center">
          <Spinner className="size-4" />
        </div>
      </div>
    )
  }

  // TypeScript 无法推断这里 history 一定存在，使用非空断言
  const history = currentChatModel.history!

  // 根据 modelKey 查找对应的模型，获取 provider 信息
  const provider = models.find(model => model.modelKey === history.modelKey)

  return <ChatBubble
    role={history.role}
    content={history.content || ''}
    reasoningContent={history.reasoningContent}
    isRunning={true}
    provider={provider}
  />
})

export default RunningChatBubble
import { useAppSelector } from "@/hooks/redux"
import { ChatModel } from "@/types/chat"
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat"
import { useMemo } from "react"

interface ChatPanelContentDetailProps {
  chatModel: ChatModel
}

/**
 * @description 具体渲染聊天内容的组件
 */
const ChatPanelContentDetail: React.FC<ChatPanelContentDetailProps> = ({
  chatModel,
}) => {
  // 模型列表
  const models = useAppSelector(state => state.models.models)
  // 当前展示的模型在模型列表里面的完整版
  const currentModel = useMemo(() => {
    return models.find(model => model.id === chatModel.modelId)
  }, [chatModel, models])

  const {
    selectedChat,
  } = useTypedSelectedChat()

  // 当前在运行的聊天
  const runningChat = useAppSelector(state => state.chat.runningChat)

  return <>
    {currentModel ? `${currentModel.modelName} | ${currentModel.nickname}` : '该模型已经被删除'}
    <div className="pt-2">--- 历史记录 ---</div>
    {chatModel.chatHistoryList?.map((history, idx) => {
      return <div key={idx}>{history}</div>
    })}
    <div className="pt-2">--- 当前运行中的记录 ---</div>
    <div>{ runningChat[selectedChat.id]?.[chatModel.modelId]?.history }</div>
  </>
}


export default ChatPanelContentDetail
import { useAppSelector } from "@/hooks/redux"
import { ChatModel, StandardMessage } from "@/types/chat"
import { useTypedSelectedChat } from "../../../../hooks/useTypedSelectedChat"
import { useMemo } from "react"
import { Alert } from "antd";
import DetailTitle from "./components/DetailTitle";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import ChatBubble from "./components/ChatBubble"
import RunningChatBubble from "./components/RunningChatBubble";

interface ChatPanelContentDetailProps {
  chatModel: ChatModel
}

/**
 * @description 具体渲染聊天内容的组件
 */
const ChatPanelContentDetail: React.FC<ChatPanelContentDetailProps> = ({
  chatModel,
}) => {
  const {
    selectedChat,
  } = useTypedSelectedChat()

  // 当前在运行的聊天
  const runningChat = useAppSelector(state => state.chat.runningChat)

  // 组合起来的，进行循环渲染的列表
  const historyList = useMemo<StandardMessage[]>(() => {
    return Array.isArray(chatModel.chatHistoryList) ? [...chatModel.chatHistoryList] : []
  }, [chatModel.chatHistoryList])


  // 控制滚动条的相关逻辑
  const {
    onScrollEvent,
    scrollbarClassname,
    isScrolling,
  } = useAdaptiveScrollbar()

  return <div
    className={`
      flex flex-col items-center text-base h-full overflow-y-auto
      pl-3
      ${isScrolling ? 'pr-0.5' : 'pr-3'}
      ${scrollbarClassname}
    `}
    onScroll={onScrollEvent}
  >
    <DetailTitle chatModel={chatModel} />
    {/* 历史记录列表 */}
    {historyList.map(historyRecord => {
      return <ChatBubble
        key={historyRecord.id}
        historyRecord={historyRecord}
      />
    })}
    {/* 单独展示正在生成的消息 */}
    <RunningChatBubble chatModel={chatModel} />
    {/* 展示可能的错误信息 */}
    {
      runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage
      && <Alert
        title={runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage}
        type="error"
        className="self-start"
      />
    }
  </div>
}


export default ChatPanelContentDetail
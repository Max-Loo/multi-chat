import { useAppSelector } from "@/hooks/redux"
import { ChatModel, StandardMessage } from "@/types/chat"
import { useTypedSelectedChat } from "../../../../hooks/useTypedSelectedChat"
import { useMemo, useRef, useState, useEffect } from "react"
import { Alert, Button } from "antd";
import DetailTitle from "./components/DetailTitle";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import ChatBubble from "./components/ChatBubble"
import RunningChatBubble from "./components/RunningChatBubble";
import { ArrowDownOutlined } from "@ant-design/icons";
import { useIsChatSending } from "../../../../hooks/useIsChatSending";
import { isNil } from "es-toolkit";

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

  const {
    isSending,
  } = useIsChatSending()

  // 组合起来的，进行循环渲染的列表
  const historyList = useMemo<StandardMessage[]>(() => {
    return Array.isArray(chatModel.chatHistoryList) ? [...chatModel.chatHistoryList] : []
  }, [chatModel.chatHistoryList])

  // 引用滚动容器
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 控制滚动条的相关逻辑
  const {
    onScrollEvent,
    scrollbarClassname,
    isScrolling,
  } = useAdaptiveScrollbar()

  // 状态：是否需要滚动条（内容超出容器高度）
  const [needsScrollbar, setNeedsScrollbar] = useState(false)

  // 状态：是否在底部
  const [isAtBottom, setIsAtBottom] = useState(true)

  /**
   * 滚动到列表底部
   */
  const scrollToBottom = () => {
    if (isNil(scrollContainerRef.current)) {
      return
    }
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
  }

  // 检测是否需要滚动条以及是否在底部
  const checkScrollStatus = () => {
    const container = scrollContainerRef.current
    if (!container) return

    // 检测是否需要滚动条（内容高度大于容器高度）
    const hasScrollbar = container.scrollHeight > container.clientHeight
    setNeedsScrollbar(hasScrollbar)

    // 检测是否在底部（允许10px的误差）
    const threshold = 24
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold
    setIsAtBottom(atBottom)
  }

  // 监听内容变化和滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // 初始检测
    checkScrollStatus()

    // 监听内容变化（使用 ResizeObserver）
    const resizeObserver = new ResizeObserver(() => {
      checkScrollStatus()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [historyList, runningChat]) // 依赖聊天历史和运行状态变化

  // 处理滚动事件
  const handleScroll = () => {
    onScrollEvent()
    checkScrollStatus()
  }

  return <div
    className={`
      flex flex-col items-center text-base h-full overflow-y-auto
      pt-2 pb-4 pl-3
      ${isScrolling ? 'pr-0.5' : 'pr-3'}
      ${scrollbarClassname}
    `}
    onScroll={handleScroll}
    ref={scrollContainerRef}
  >
    <DetailTitle chatModel={chatModel} />
    {/* 历史记录列表 */}
    {historyList.map(historyRecord => {
      return <ChatBubble
        key={historyRecord.id}
        historyRecord={historyRecord}
      />
    })}
    {historyList.map(historyRecord => {
      return <ChatBubble
        key={historyRecord.id}
        historyRecord={historyRecord}
      />
    })}
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
    {/* 滚动到底部按钮 - 只有当需要滚动条且不在底部时才显示 */}
    {needsScrollbar && !isAtBottom && (
      <Button
        onClick={scrollToBottom}
        className="absolute! bottom-24 border-0!"
        title="滚动到底部"
        shape="circle"
        size="large"
        type="primary"
      >
        {isSending ? <>
          <div
            className={`
            absolute inset-0 border-4 rounded-full
            border-blue-300 border-t-blue-500
            animate-spin w-full h-full bg-white
            group-hover:border-t-blue-400
            group-hover:border-blue-200
          `}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center w-full h-full rounded-xl">
            <ArrowDownOutlined className="text-blue-500! group-hover:text-blue-400!" />
          </div>
        </> : <ArrowDownOutlined />}
      </Button>
    )}
  </div>
}


export default ChatPanelContentDetail
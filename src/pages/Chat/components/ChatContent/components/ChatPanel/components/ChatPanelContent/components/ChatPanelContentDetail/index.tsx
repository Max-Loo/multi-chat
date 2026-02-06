import { useAppSelector } from "@/hooks/redux"
import { ChatModel, StandardMessage } from "@/types/chat"
import { useTypedSelectedChat } from "../../../../hooks/useTypedSelectedChat"
import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import DetailTitle from "./components/DetailTitle";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import ChatBubble from "./components/ChatBubble"
import RunningChatBubble from "./components/RunningChatBubble";
import { useIsChatSending } from "../../../../hooks/useIsChatSending";
import { isNil } from "es-toolkit"
import { useTranslation } from "react-i18next" 

interface ChatPanelContentDetailProps {
  chatModel: ChatModel
}

/**
 * @description 具体渲染聊天内容的组件
 */
const ChatPanelContentDetail: React.FC<ChatPanelContentDetailProps> = ({
  chatModel,
}) => {
  const { t } = useTranslation()
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
    isScrolling
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
  const checkScrollStatus = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // 检测是否需要滚动条（内容高度大于容器高度）
    const hasScrollbar = container.scrollHeight > container.clientHeight
    setNeedsScrollbar(hasScrollbar)

    // 检测是否在底部（允许10px的误差）
    const threshold = 24
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold
    setIsAtBottom(atBottom)
  }, [])

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
  }, [historyList, runningChat, checkScrollStatus]) // 依赖聊天历史、运行状态变化和滚动状态检测函数

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    checkScrollStatus()
    onScrollEvent()
  }, [checkScrollStatus, onScrollEvent])

  // 添加 passive 监听器
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return <div
    className={`
      flex flex-col items-center text-base h-full overflow-y-auto
      pt-2 pb-4 pl-3
      ${isScrolling ? 'pr-0.5' : 'pr-3'}
      ${scrollbarClassname}
    `}
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
    {/* 单独展示正在生成的消息 */}
    <RunningChatBubble chatModel={chatModel} />
    {/* 展示可能的错误信息 */}
    {
      runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage
      && <Alert
        variant="destructive"
        className="self-start"
      >
        <AlertDescription>
          {runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage}
        </AlertDescription>
      </Alert>
    }
    {/* 滚动到底部按钮 - 只有当需要滚动条且不在底部时才显示 */}
    {needsScrollbar && !isAtBottom && (
      <Button
        onClick={scrollToBottom}
        className="absolute bottom-[110px] rounded-full h-10 w-10 bg-gray-900 text-white shadow-md hover:shadow-lg hover:bg-gray-800 transition-all"
        title={t($ => $.chat.scrollToBottom)}
        size="icon"
      >
        {isSending ? <>
          <div
            className={`
            absolute inset-0 border-4 rounded-full
            border-gray-300 border-t-gray-600
            animate-spin w-full h-full bg-white
          `}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ArrowDown className="text-gray-700" />
          </div>
        </> : <ArrowDown />}
      </Button>
    )}
  </div>
}


export default ChatPanelContentDetail

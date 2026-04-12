import { useAppSelector } from "@/hooks/redux"
import { ChatModel, StandardMessage } from "@/types/chat"
import { useSelectedChat } from "@/pages/Chat/hooks/useSelectedChat"
import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import Title from "./Title";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import { ChatBubble } from "@/components/chat/ChatBubble"
import RunningBubble from "./RunningBubble";
import { useIsSending } from "@/pages/Chat/hooks/useIsSending";
import { isNil, isNotNil } from "es-toolkit"
import { useTranslation } from "react-i18next"

interface DetailProps {
  chatModel: ChatModel
}

/**
 * 具体渲染聊天内容的组件
 */
const Detail: React.FC<DetailProps> = ({
  chatModel,
}) => {
  const { t } = useTranslation()
  const {
    selectedChat,
  } = useSelectedChat()

  // 当前在运行的聊天数据（精确到 chatId + modelId）
  const runningChatData = useAppSelector(state =>
    selectedChat ? state.chat.runningChat[selectedChat.id]?.[chatModel.modelId] : undefined
  )

  const {
    isSending,
  } = useIsSending()

  // 组合起来的，进行循环渲染的列表
  // 🔧 修复：直接返回原数组引用，避免每次 useMemo 都创建新数组导致无限循环
  const historyList = useMemo<StandardMessage[]>(() => {
    return Array.isArray(chatModel.chatHistoryList) ? chatModel.chatHistoryList : []
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

  // 🔧 添加防抖标志，防止 ResizeObserver 导致的无限循环
  const isCheckingScrollRef = useRef(false)

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
    // 🔧 防止递归调用
    if (isCheckingScrollRef.current) {
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    isCheckingScrollRef.current = true

    // 检测是否需要滚动条（内容高度大于容器高度）
    const hasScrollbar = container.scrollHeight > container.clientHeight

    // 检测是否在底部（允许10px的误差）
    const threshold = 24
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold

    // 🔧 使用 requestAnimationFrame 避免在同一帧内多次更新状态
    requestAnimationFrame(() => {
      setNeedsScrollbar(hasScrollbar)
      setIsAtBottom(atBottom)

      // 🔧 延迟重置标志，确保状态更新完成
      setTimeout(() => {
        isCheckingScrollRef.current = false
      }, 100)
    })
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
  }, [historyList, runningChatData, checkScrollStatus]) // 依赖聊天历史、运行状态变化和滚动状态检测函数

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

  return (
    <>
      <div
        className={`
          flex flex-col items-center text-base h-full overflow-y-auto
          pt-2 pb-4 pl-3
          ${isScrolling ? 'pr-0.5' : 'pr-3'}
          ${scrollbarClassname}
        `}
        ref={scrollContainerRef}
      >
    <Title chatModel={chatModel} />
    {/* 历史记录列表 */}
    {historyList.map(historyRecord => {
      return <ChatBubble
        key={historyRecord.id}
        role={historyRecord.role}
        content={historyRecord.content || ''}
        reasoningContent={historyRecord.reasoningContent}
        isRunning={false}
      />
    })}
    {/* 单独展示正在生成的消息 */}
    <RunningBubble chatModel={chatModel} />
    {/* 展示可能的错误信息 */}
    {
      isNotNil(selectedChat) && runningChatData?.errorMessage
      && <Alert
        variant="destructive"
        className="self-start"
      >
        <AlertDescription>
          {runningChatData?.errorMessage}
        </AlertDescription>
      </Alert>
    }
    {/* 滚动到底部按钮 - 只有当需要滚动条且不在底部时才显示 */}
    {needsScrollbar && !isAtBottom && (
      <Button
        onClick={scrollToBottom}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90 transition-all z-50"
        title={t($ => $.chat.scrollToBottom)}
        size="icon"
      >
        {isSending ? <>
          <div
            className={`
            absolute inset-0 border-4 rounded-full
            border-muted border-t-foreground/50
            animate-spin w-full h-full bg-primary-foreground
          `}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ArrowDown className="text-foreground" />
          </div>
        </> : <ArrowDown />}
      </Button>
    )}
      </div>
    </>
  )
}


export default Detail

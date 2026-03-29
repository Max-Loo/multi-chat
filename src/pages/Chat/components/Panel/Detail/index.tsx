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
import { Virtualizer } from "virtua"
import type { VirtualizerHandle } from "virtua"

/** 滚动到底部的阈值（px） */
const SCROLL_BOTTOM_THRESHOLD = 24

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

  // Virtualizer 引用
  const virtualizerRef = useRef<VirtualizerHandle>(null)

  // Title 引用，用于测量高度作为 startMargin
  const titleRef = useRef<HTMLDivElement>(null)

  // 跟踪用户是否在底部（用于流式自动跟随判断）
  const shouldStickToBottom = useRef(true)

  // Virtualizer 的 startMargin（Title 的高度）
  const [startMargin, setStartMargin] = useState(0)

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
   * 优先使用 Virtualizer API 以确保与虚拟化引擎协调
   */
  const scrollToBottom = useCallback(() => {
    const virtualizer = virtualizerRef.current
    if (virtualizer) {
      virtualizer.scrollToIndex(historyList.length - 1, { align: 'end' })
      return
    }
    // 降级：无虚拟化时直接操作 DOM
    const container = scrollContainerRef.current
    if (isNil(container)) {
      return
    }
    container.scrollTop = container.scrollHeight
  }, [historyList.length])

  // 检测是否需要滚动条以及是否在底部
  const checkScrollStatus = useCallback(() => {
    // 防止递归调用
    if (isCheckingScrollRef.current) {
      return
    }

    const container = scrollContainerRef.current
    if (!container) return

    isCheckingScrollRef.current = true

    // 检测是否需要滚动条（内容高度大于容器高度）
    const hasScrollbar = container.scrollHeight > container.clientHeight

    // 检测是否在底部
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= SCROLL_BOTTOM_THRESHOLD

    // 使用 requestAnimationFrame 避免在同一帧内多次更新状态
    requestAnimationFrame(() => {
      setNeedsScrollbar(hasScrollbar)
      setIsAtBottom(atBottom)

      // 在下一帧重置标志，确保状态更新已完成
      requestAnimationFrame(() => {
        isCheckingScrollRef.current = false
      })
    })
  }, [])

  // 监听 Title 高度变化，更新 Virtualizer 的 startMargin
  useEffect(() => {
    const titleEl = titleRef.current
    if (!titleEl) return

    const resizeObserver = new ResizeObserver(([entry]) => {
      setStartMargin(entry.contentRect.height)
    })
    resizeObserver.observe(titleEl)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 流式自动跟随：当用户在底部且有流式数据更新时，等待 DOM 更新后自动滚动到底部
  useEffect(() => {
    if (shouldStickToBottom.current && runningChatData) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [runningChatData, scrollToBottom])

  // 监听内容变化和滚动容器尺寸变化
  useEffect(() => {
    // 初始检测
    checkScrollStatus()

    const container = scrollContainerRef.current
    if (!container) return

    // 监听容器尺寸变化（使用 ResizeObserver）
    const resizeObserver = new ResizeObserver(() => {
      checkScrollStatus()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [historyList, runningChatData, checkScrollStatus])

  // Virtualizer 滚动事件处理（替代原有的 addEventListener）
  const handleVirtualizerScroll = useCallback((_offset: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    // 更新 shouldStickToBottom
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= SCROLL_BOTTOM_THRESHOLD
    shouldStickToBottom.current = atBottom

    checkScrollStatus()
    onScrollEvent()
  }, [checkScrollStatus, onScrollEvent])

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
    <div ref={titleRef} className="w-full">
      <Title chatModel={chatModel} />
    </div>
    {/* 历史记录列表 — 使用 Virtualizer 虚拟化渲染 */}
    <div className="w-full">
      <Virtualizer
        ref={virtualizerRef}
        startMargin={startMargin}
        scrollRef={scrollContainerRef}
        onScroll={handleVirtualizerScroll}
      >
        {historyList.map(historyRecord => {
          return <ChatBubble
            key={historyRecord.id}
            role={historyRecord.role}
            content={historyRecord.content || ''}
            reasoningContent={historyRecord.reasoningContent}
            isRunning={false}
          />
        })}
      </Virtualizer>
    </div>
    {/* 单独展示正在生成的消息（放在 Virtualizer 外部，不参与虚拟化） */}
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 bg-gray-900 text-white shadow-md hover:shadow-lg hover:bg-gray-800 transition-all z-50"
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
    </>
  )
}


export default Detail

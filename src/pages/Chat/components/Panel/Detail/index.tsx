import { useAppSelector, useAppDispatch } from "@/hooks/redux"
import { ChatModel, ChatRoleEnum, StandardMessage } from "@/types/chat"
import { useSelectedChat } from "@/pages/Chat/hooks/useSelectedChat"
import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import Title from "./Title";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import { ChatBubble } from "@/components/chat/ChatBubble"
import { useIsSending } from "@/pages/Chat/hooks/useIsSending";
import { isNotNil } from "es-toolkit"
import { Spinner } from "@/components/ui/spinner"
import { useTranslation } from "react-i18next"
import { Virtualizer } from "virtua"
import type { VirtualizerHandle } from "virtua"
import { getCurrentContent } from "@/services/chat/chatHistoryHelper"
import { editAndResendMessage, regenerateMessage } from "@/store/slices/chatSlices"
import { copyToClipboard } from "@/utils/clipboard"
import { toastQueue } from "@/services/toast"

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
  const dispatch = useAppDispatch()
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

  // 成对消息的历史索引状态（消息 ID → 当前查看的历史索引）
  const [pairHistoryIndices, setPairHistoryIndices] = useState<Record<string, number>>({})

  // 当前正在重新生成的消息 ID（null 表示无重新生成或发送新消息）
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)

  // 历史消息列表
  const historyList = useMemo<StandardMessage[]>(() => {
    return Array.isArray(chatModel.chatHistoryList) ? chatModel.chatHistoryList : []
  }, [chatModel.chatHistoryList])

  // 计算每条消息的操作属性
  const messageMeta = useMemo(() => {
    const result: Record<string, {
      isLatestUserMessage: boolean;
      isLastAssistant: boolean;
    }> = {}

    // 找到最后一条用户消息和最后一条 AI 回复的索引
    let latestUserIndex = -1;
    let lastAssistantIndex = -1;
    for (let i = historyList.length - 1; i >= 0; i--) {
      if (lastAssistantIndex === -1 && historyList[i].role === ChatRoleEnum.ASSISTANT) {
        lastAssistantIndex = i;
      }
      if (latestUserIndex === -1 && historyList[i].role === ChatRoleEnum.USER) {
        latestUserIndex = i;
      }
      if (latestUserIndex !== -1 && lastAssistantIndex !== -1) break;
    }

    historyList.forEach((msg, index) => {
      result[msg.id] = {
        isLatestUserMessage: index === latestUserIndex,
        isLastAssistant: index === lastAssistantIndex,
      };
    });

    return result;
  }, [historyList])

  // 合并列表：历史消息 + 流式消息（统一由 Virtualizer 管理）
  const displayList = useMemo(() => {
    type DisplayEntry = { message: StandardMessage; displayMessage: StandardMessage; isRunning: boolean }
    const list: DisplayEntry[] =
      historyList.map(msg => ({ message: msg, displayMessage: msg, isRunning: false }))

    const runningHistory = runningChatData?.isSending ? runningChatData.history : null
    const hasRunningContent = runningHistory &&
      (getCurrentContent(runningHistory.content) || runningHistory.reasoningContent)

    if (hasRunningContent && runningHistory) {
      if (regeneratingMessageId) {
        // 重新生成模式：在原位置替换显示内容
        const targetIndex = list.findIndex(entry => entry.message.id === regeneratingMessageId)
        if (targetIndex !== -1) {
          list[targetIndex] = {
            message: list[targetIndex].message,
            displayMessage: runningHistory,
            isRunning: true,
          }
        }
      } else {
        // 发送新消息模式：追加到末尾
        list.push({ message: runningHistory, displayMessage: runningHistory, isRunning: true })
      }
    }

    return list
  }, [historyList, runningChatData?.isSending, runningChatData?.history, regeneratingMessageId])

  // 计算消息配对关系（用户消息 → 下一条 AI 回复，双向映射）
  const messagePairs = useMemo(() => {
    const result: Record<string, string> = {}
    for (let i = 0; i < historyList.length - 1; i++) {
      if (historyList[i].role === ChatRoleEnum.USER &&
          historyList[i + 1].role === ChatRoleEnum.ASSISTANT) {
        result[historyList[i].id] = historyList[i + 1].id
        result[historyList[i + 1].id] = historyList[i].id
      }
    }
    return result
  }, [historyList])

  const historyCallbacks = useMemo(() => {
    const callbacks: Record<string, (index: number) => void> = {}
    for (const msgId of Object.keys(messagePairs)) {
      callbacks[msgId] = (index: number) => {
        const pairedId = messagePairs[msgId]
        setPairHistoryIndices(prev => ({
          ...prev,
          [msgId]: index,
          ...(pairedId ? { [pairedId]: index } : {}),
        }))
      }
    }
    return callbacks
  }, [messagePairs])

  // 追踪每条消息的上一次 content.length，用于区分"编辑推送新版本"与"原地覆盖"
  const prevContentLengthsRef = useRef<Record<string, number>>({});

  // 当消息内容长度增长时（编辑推送新版本），重置历史索引到最新版本；原地覆盖（长度不变）不触发重置
  useEffect(() => {
    setPairHistoryIndices(prev => {
      const next: Record<string, number> = {}
      let changed = false
      const prevLengths = prevContentLengthsRef.current;
      const newLengths: Record<string, number> = {};

      for (const { message } of displayList) {
        if (Array.isArray(message.content)) {
          const length = message.content.length;
          newLengths[message.id] = length;
          const prevLength = prevLengths[message.id];
          // 仅在长度增长时重置（编辑推送新版本）；首次出现或长度不变时跳过
          if (prevLength !== undefined && length > prevLength) {
            const maxIndex = length - 1;
            if (prev[message.id] !== maxIndex) {
              next[message.id] = maxIndex;
              changed = true;
            }
          }
        }
      }

      prevContentLengthsRef.current = newLengths;
      return changed ? { ...prev, ...next } : prev;
    });
  }, [displayList])

  // 引用滚动容器
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 同步 displayList.length 到 ref，供 scrollToBottom 稳定引用
  const displayLengthRef = useRef(displayList.length)
  useEffect(() => { displayLengthRef.current = displayList.length }, [displayList.length])

  // Virtualizer 引用
  const virtualizerRef = useRef<VirtualizerHandle>(null)

  // Title 引用，用于测量高度作为 startMargin
  const titleRef = useRef<HTMLDivElement>(null)

  // isAtBottom 的 ref 镜像，供 effect 读取避免重建
  const isAtBottomRef = useRef(true)

  // 流式自动跟随期间保护 isAtBottom 状态，避免竞态导致按钮闪现
  const isStreamingRef = useRef(false)

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

  /**
   * 滚动到列表底部
   * 通过 displayLengthRef 读取合并列表长度，流式/非流式统一使用 scrollToIndex
   */
  const scrollToBottom = useCallback(() => {
    virtualizerRef.current?.scrollToIndex(displayLengthRef.current - 1, { align: 'end' })
  }, [])

  // 检测是否需要滚动条以及是否在底部
  const checkScrollStatus = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // 检测是否需要滚动条（内容高度大于容器高度）
    const hasScrollbar = container.scrollHeight > container.clientHeight
    setNeedsScrollbar(prev => prev === hasScrollbar ? prev : hasScrollbar)

    // 流式自动跟随期间保护 isAtBottom 状态：若正在流式跟随且原本在底部，跳过检测
    if (isStreamingRef.current && isAtBottomRef.current) return

    // 检测是否在底部
    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= SCROLL_BOTTOM_THRESHOLD
    setIsAtBottom(prev => prev === atBottom ? prev : atBottom)
    isAtBottomRef.current = atBottom
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
    if (isAtBottomRef.current && runningChatData) {
      isStreamingRef.current = true
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [runningChatData, scrollToBottom])

  // ResizeObserver：监听容器尺寸变化，依赖为空（挂载一次不重建）
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      checkScrollStatus()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [checkScrollStatus])

  // 内容变化时检测滚动状态
  useEffect(() => {
    checkScrollStatus()
  }, [displayList.length, runningChatData, checkScrollStatus])

  // Virtualizer 滚动事件处理
  const handleVirtualizerScroll = useCallback((_offset: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= SCROLL_BOTTOM_THRESHOLD
    isAtBottomRef.current = atBottom

    // 滚动回调中重置流式保护，确保 auto-scroll 完成后或用户主动上滚时恢复正常检测
    isStreamingRef.current = false

    checkScrollStatus()
    onScrollEvent()
  }, [checkScrollStatus, onScrollEvent])

  const messageMap = useMemo(() => {
    const map = new Map<string, StandardMessage>()
    for (const msg of historyList) {
      map.set(msg.id, msg)
    }
    return map
  }, [historyList])

  const handleCopy = useCallback(async (messageId: string) => {
    const message = messageMap.get(messageId);
    if (!message) return;
    try {
      await copyToClipboard(getCurrentContent(message.content));
      toastQueue.success(t($ => $.chat.copySuccess));
    } catch {
      toastQueue.error(t($ => $.chat.copyFailed));
    }
  }, [messageMap, t]);

  // 编辑消息回调
  const handleEdit = useCallback((messageId: string, newContent: string) => {
    if (!selectedChat) return;
    dispatch(editAndResendMessage({
      chatId: selectedChat.id,
      userMessageId: messageId,
      newContent,
    }));
  }, [selectedChat, dispatch]);

  // 重新生成回调
  const handleRegenerate = useCallback((messageId: string, historyIndex: number) => {
    if (!selectedChat) return;
    setRegeneratingMessageId(messageId);
    dispatch(regenerateMessage({
      chatId: selectedChat.id,
      assistantMessageId: messageId,
      historyIndex,
    })).finally(() => setRegeneratingMessageId(null));
  }, [selectedChat, dispatch]);

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
    {/* 消息列表 — 使用 Virtualizer 虚拟化渲染（历史 + 流式统一管理） */}
    <div className="w-full">
      <Virtualizer
        ref={virtualizerRef}
        startMargin={startMargin}
        scrollRef={scrollContainerRef}
        onScroll={handleVirtualizerScroll}
      >
        {displayList.map(({ message, displayMessage, isRunning }) => {
          const meta = messageMeta[message.id];
          const isPaired = !!messagePairs[message.id];
          return <ChatBubble
            key={message.id}
            role={message.role}
            content={displayMessage.content}
            reasoningContent={displayMessage.reasoningContent}
            isRunning={isRunning}
            messageId={message.id}
            isLatestUserMessage={meta?.isLatestUserMessage}
            isLastAssistant={meta?.isLastAssistant}
            isChatSending={isSending}
            historyIndexOverride={pairHistoryIndices[message.id]}
            onHistoryIndexChange={isPaired ? historyCallbacks[message.id] : undefined}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onRegenerate={handleRegenerate}
          />
        })}
      </Virtualizer>
    </div>
    {/* 流式消息尚未产出内容时展示 loading spinner */}
    {runningChatData?.isSending &&
      (!runningChatData.history || (!getCurrentContent(runningChatData.history.content) && !runningChatData.history.reasoningContent)) && (
      <div className="w-full mt-3 flex justify-start">
        <div className="bg-muted text-muted-foreground px-4 py-3 rounded-lg flex items-center">
          <Spinner className="size-4" />
        </div>
      </div>
    )}
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

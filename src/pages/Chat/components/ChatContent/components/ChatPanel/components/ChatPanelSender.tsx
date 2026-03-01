import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isNil, isString } from "es-toolkit";
import React, { useRef, useState } from "react"
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { startSendChatMessage } from "@/store/slices/chatSlices";
import { useIsChatSending } from "../hooks/useIsChatSending";
import { useTranslation } from "react-i18next";
import { selectIncludeReasoningContent, setIncludeReasoningContent } from "@/store/slices/appConfigSlices";

interface SendButtonProps {
  // 是否处于发送状态
  isSending?: boolean;
  // 是否禁用按钮
  disabled?: boolean;
  // 按钮点击事件回调
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// 封装发送按钮
const SendButton: React.FC<SendButtonProps> = ({
  isSending = false,
  disabled = false,
  onClick = () => {},
}) => {
  const { t } = useTranslation()

  return <>
    <Button
      className={`
        relative flex items-center justify-center p-0 h-10 w-10 rounded-full
        bg-gray-900 text-white hover:bg-gray-800
        shadow-md hover:shadow-lg
        transition-all group shrink-0
      `}
      onClick={onClick}
      disabled={disabled}
      title={isSending ? t($ => $.chat.stopSending) : t($ => $.chat.sendMessage)}
    >
      {isSending ? <>
        <div
          className={`
            absolute inset-0 border-4 rounded-full
            border-gray-300 border-t-gray-600
            animate-spin
          `}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>
        </div>
      </> : <ArrowUp size={20} />}
    </Button>
  </>

}

/**
 * 检测是否为 macOS 平台的 Safari 浏览器
 * 用于处理 Safari 中文输入法的 Enter 键 bug
 *
 * @returns {boolean} 如果是 macOS Safari 则返回 true，否则返回 false
 */
const isMacSafari = (): boolean => {
  const ua = navigator.userAgent;
  return /Mac|macOS/.test(ua) && /Safari/.test(ua) && !/Chrome|Edge|Firefox/.test(ua);
};

/**
 * @description 聊天内容发送框
 */
const ChatPanelSender: React.FC = () => {
  const { t } = useTranslation()

  const dispatch = useAppDispatch()

  // 获取是否传输推理内容的开关状态
  const includeReasoningContent = useAppSelector(selectIncludeReasoningContent)

  const {
    selectedChat,
  } = useTypedSelectedChat()

  const {
    isSending,
  } = useIsChatSending()

  // 要发送的内容
  const [text, setText] = useState('')

  // 保存取消事件
  const abortSendEventRef = useRef<AbortController | null>(null)

  // 发送消息
  const sendMessage = (message: string) => {
    if (!isString(message) || !message.trim()) {
      // 空消息不会发送
      return
    }
    if (isNil(selectedChat)) {
      // 没有选中的聊天，无法发送
      return
    }
    // 清空现有的输入
    setText('')

    const abortController = new AbortController()

    dispatch(startSendChatMessage({
      chat: selectedChat,
      message,
    }, { signal: abortController.signal }))

    // 将取消事件保存下来，以便中断
    abortSendEventRef.current = abortController
  }

  // 点击发送按钮
  const onClickSendBtn = () => {
    if (isSending) {
      // 如果处于发送状态，停止上次的发送事件
      if (abortSendEventRef.current) {
        abortSendEventRef.current.abort(t($ => $.common.cancel))
        abortSendEventRef.current = null
      }
      return
    }

    sendMessage(text)
  }

  // 记录最近一次 compositionEnd 事件的 timestamp
  const [compositionEndTimestamp, setCompositionEndTimestamp] = useState(0)

  // 按下回车按钮的回调，直接回车是发送，shift + enter 是换行
  const onPressEnterBtn: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // 只有按下 Enter 键且没有按 Shift 键时才发送消息
    if (e.key === 'Enter' && !e.shiftKey) {
      // 阻止默认行为（换行）
      e.preventDefault()

      if (isSending) {
        // 如果处于发送状态，忽略回车事件
        return
      }

      /**
       * @link https://bugs.webkit.org/show_bug.cgi?id=165004
       * 在 MAC 端的 safari 中，isComposing 属性无效，导致在中文输入法下，按下 Enter 键而错误触发
       * 且在 safari 中，onCompositionEnd 事件会在 onKeyDown 事件前触发；（正确情况下应该是反过来）
       * hack - 直接判断两个触发事件的间隔是否满足一定时间差
       */
      if (isMacSafari() && Math.abs(e.timeStamp - compositionEndTimestamp) < 100) {
        return
      }

      // 进行发送逻辑
      sendMessage(text)
    }
  }



  return (
    <div className="relative z-10 w-full px-4 py-3 bg-background border-t border-border">
      {/* 推理内容开关 */}
      {/*
        临时隐藏：推理内容开关 UI
        隐藏原因：当前模型服务商（DeepSeek、Kimi、Zhipu）不支持 Vercel AI SDK 的 `type: 'reasoning'` 消息格式
        恢复方式：移除下方 <div> 的 `className="hidden"` 属性即可
        技术债务：待模型服务商支持推理内容后恢复此 UI
        隐藏日期：2026-02-27
      */}
      <div className="hidden items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(setIncludeReasoningContent(!includeReasoningContent))}
          title={t($ => $.chat.includeReasoningContentHint)}
          className={`
            h-8 px-3 rounded-md
            transition-all duration-200
            ${includeReasoningContent
              ? "border-blue-500 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-500"
              : "border-gray-300 text-gray-500 bg-white hover:border-gray-400 hover:text-gray-700"
            }
          `}
        >
          {t($ => $.chat.includeReasoningContent)}
        </Button>
      </div>
      <div className="relative flex items-end gap-3">
        <Textarea
          className={`
            flex-1 text-base rounded-lg border border-input bg-background
            shadow-md px-4 py-3 min-h-20 max-h-80 resize-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            transition-all
          `}
          placeholder={t($ => $.chat.typeMessage)}
          value={text}
          onChange={(e) => { setText(e.target.value) }}
          onKeyDown={onPressEnterBtn}
          onCompositionEnd={(e) => { setCompositionEndTimestamp(e.timeStamp) }}
        />
        {/* 发送按钮 */}
        <SendButton
          isSending={isSending}
          onClick={onClickSendBtn}
        />
      </div>
    </div>
  )
}

export default ChatPanelSender
import { ArrowUpOutlined } from "@ant-design/icons";
import { Button, Input } from "antd"
import { isString } from "es-toolkit";
import React, { useRef, useState } from "react"
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat";
import { useAppDispatch } from "@/hooks/redux";
import { startSendChatMessage } from "@/store/slices/chatSlices";
import { platform } from '@tauri-apps/plugin-os';
import { useIsChatSending } from "../hooks/useIsChatSending";
import { useTranslation } from "react-i18next";

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
        absolute! right-6! bottom-6! flex items-center justify-center p-0!
        ${isSending && 'border-0!'}
        group
      `}
      color="primary"
      variant="solid"
      onClick={onClick}
      disabled={disabled}
      shape="circle"
      size="large"
      title={isSending ? t($ => $.chat.stopSending) : t($ => $.chat.sendMessage)}
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
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm group-hover:bg-blue-400"></div>
        </div>
      </> : <ArrowUpOutlined /> }
    </Button>
  </>

}


/**
 * @description 聊天内容发送框
 */
const ChatPanelSender: React.FC = () => {
  const { t } = useTranslation()

  const dispatch = useAppDispatch()

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
    if (!e.shiftKey) {
      // 这里表面直接按下了回车
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
      const currentPlatform = platform();
      if (currentPlatform === 'macos' && Math.abs(e.timeStamp - compositionEndTimestamp) < 100) {
        return
      }

      // 进行发送逻辑
      sendMessage(text)

    }
  }



  return (
    <div className="relative w-full h-22 bg-gray-50">
      <div className="absolute bottom-0 left-0 w-full p-4">
        <Input.TextArea
          className="w-full text-base! rounded-xl"
          autoSize={{ minRows: 2, maxRows: 10 }}
          value={text}
          onChange={(e) => { setText(e.target.value) }}
          onPressEnter={onPressEnterBtn}
          onCompositionEnd={(e) => { setCompositionEndTimestamp(e.timeStamp) }}
        />
      </div>
      {/* 发送按钮 */}
      <SendButton
        isSending={isSending}
        onClick={onClickSendBtn}
      />
    </div>
  )
}

export default ChatPanelSender
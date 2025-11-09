import { ArrowUpOutlined } from "@ant-design/icons";
import { Button, Input } from "antd"
import React, { useState } from "react"

interface SendButtonProps {
  // 是否处于发送状态
  sending?: boolean;
  // 是否禁用按钮
  disabled?: boolean;
  // 按钮点击事件回调
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// 封装发送按钮
const SendButton: React.FC<SendButtonProps> = ({
  sending = false,
  disabled = false,
  onClick = () => {},
}) => {


  return <>
    <Button
      className={`
        absolute! right-6! bottom-6! flex items-center justify-center p-0!
        ${sending && 'border-0!'}
        group
      `}
      color="primary"
      variant="solid"
      onClick={onClick}
      disabled={disabled}
      shape="circle"
      size="large"
      icon={!sending && <ArrowUpOutlined />}
    >
      {sending && <>
        <div
          className={`
            absolute inset-0 border-4 rounded-full
            border-blue-300 border-t-blue-500
            animate-spin w-full h-full bg-white
            group-hover:border-t-blue-400
            group-hover:border-blue-200
          `}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center w-full h-full rounded-full">
          <div className="w-3 h-3 bg-blue-500 rounded-sm group-hover:bg-blue-400"></div>
        </div>
      </>}
    </Button>
  </>

}



/**
 * @description 聊天内容发送框
 */
const ChatPanelSender: React.FC = () => {

  const [sending, setSending] = useState(false)

  // 点击发送那妞
  const onClickSendBtn = () => {
    setSending(!sending)
  }

  return (
    <div className="relative w-full h-22 bg-gray-50">
      <div className="absolute bottom-0 left-0 w-full p-4">
        <Input.TextArea
          className="w-full text-base! rounded-xl"
          autoSize={{ minRows: 2, maxRows: 10 }}
        >
        </Input.TextArea>
      </div>
      {/* 发送按钮 */}
      <SendButton
        sending={sending}
        onClick={onClickSendBtn}
      />
    </div>
  )
}

export default ChatPanelSender
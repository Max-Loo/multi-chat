import { useState } from "react"
import ChatPanelHeader from "./components/ChatPanelHeader"
import ChatPanelContent from "./components/ChatPanelContent"
import ChatPanelSender from "./components/ChatPanelSender"
import { useTypedSelectedChat } from "./hooks/useTypedSelectedChat"

/**
 * @description 聊天具体内容页面
 */
const ChatPanel: React.FC = () => {

  const {
    chatModelList,
  } = useTypedSelectedChat()

  // 控制每一行展示多少个聊天框
  const [columnCount, setColumnCount] = useState(chatModelList.length)

  return <div className="relative flex flex-col items-center justify-start w-full h-full">
    {/* 为了实现「上中下」的布局，内部采用 absolute 定位 ，为了保持层级正常，将组件写在最前面 */}
    <ChatPanelContent
      columnCount={columnCount}
    />
    {/* 头部 */}
    <ChatPanelHeader
      columnCount={columnCount}
      setColumnCount={setColumnCount}
    />
    {/* 内容部分 */}
    <div className="flex flex-col w-full grow">
      {/* 仅占位 */}
    </div>
    {/* 发送框 */}
    <ChatPanelSender />
  </div>
}

export default ChatPanel


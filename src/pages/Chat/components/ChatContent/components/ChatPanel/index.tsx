import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { Chat } from "@/types/chat"
import { useMemo, useState } from "react"
import ChatPanelHeader from "./components/ChatPanelHeader"
import ChatPanelContent from "./components/ChatPanelContent"

/**
 * @description 聊天具体内容页面
 */
const ChatPanel: React.FC = () => {

  const {
    selectedChat,
  } = useCurrentSelectedChat()
  const typedSelectedChat = useMemo(() => selectedChat as Chat, [selectedChat])

  const chatModelList = useMemo(() => {
    return typedSelectedChat.chatModelList || []
  }, [typedSelectedChat])

  // 控制每一行展示多少个聊天框
  const [columnCount, setColumnCount] = useState(chatModelList.length)

  return <div className="flex flex-col items-center justify-start w-full h-full">
    {/* 头部 */}
    <div className="flex items-center justify-between w-full pl-3 pr-3 border-b border-gray-200 min-h-12">
      <ChatPanelHeader
        selectedChat={typedSelectedChat}
        chatModelList={chatModelList}
        columnCount={columnCount}
        setColumnCount={setColumnCount}
      />
    </div>
    {/* 内容部分 */}
    <div className="w-full grow">
      <ChatPanelContent
        chatModelList={chatModelList}
        columnCount={columnCount}
      />
    </div>
  </div>
}

export default ChatPanel


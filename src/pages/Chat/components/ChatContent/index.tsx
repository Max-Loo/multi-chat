import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { isNull } from "es-toolkit"
import ModelSelect from "./components/ModelSelect"
import ChatPanel from "./components/ChatPanel"

/**
 * @description 聊天页面的具体内容
 */
const ChatContent: React.FC = () => {
  const {
    selectedChat,
  } = useCurrentSelectedChat()

  // 默认占位内容
  if (isNull(selectedChat)) {
    return (<div className="flex items-center justify-center w-full h-full text-4xl">
      选择聊天开聊！
    </div>)
  }

  // 还没有给这个「聊天」配置过模型的状态
  if (!Array.isArray(selectedChat.chatModelList) || selectedChat.chatModelList.length <= 0) {
    return <ModelSelect />
  }

  // 正常的聊天框
  return (
    <ChatPanel />
  )
}

export default ChatContent
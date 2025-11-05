import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"

/**
 * @description 聊天页面的具体内容
 */
const ChatContent: React.FC = () => {
  const {
    selectedChat,
  } = useCurrentSelectedChat()

  return (
    <div>{selectedChat?.name || ''}</div>
  )
}

export default ChatContent
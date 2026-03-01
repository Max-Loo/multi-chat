import { lazy, Suspense } from "react"
import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { isNil } from "es-toolkit"
import { useTranslation } from "react-i18next"
import ModelSelectSkeleton from "./components/ModelSelectSkeleton"
import ChatPanelSkeleton from "./components/ChatPanel/components/ChatPanelSkeleton"

const ModelSelect = lazy(() => import("./components/ModelSelect"))
const ChatPanel = lazy(() => import("./components/ChatPanel"))

/**
 * @description 聊天页面的具体内容
 */
const ChatContent: React.FC = () => {
  const selectedChat = useCurrentSelectedChat()
  const { t } = useTranslation()

  // 默认占位内容
  if (isNil(selectedChat)) {
    return (<div className="flex items-center justify-center w-full h-full text-4xl">
      {t($ => $.chat.selectChatToStart)}
    </div>)
  }

  // 还没有给这个「聊天」配置过模型的状态
  if (!Array.isArray(selectedChat.chatModelList) || selectedChat.chatModelList.length <= 0) {
    return (
      <Suspense fallback={<ModelSelectSkeleton />}>
        <ModelSelect />
      </Suspense>
    )
  }

  // 正常的聊天框
  return (
    <Suspense fallback={<ChatPanelSkeleton columnCount={selectedChat.chatModelList.length} />}>
      <ChatPanel />
    </Suspense>
  )
}

export default ChatContent
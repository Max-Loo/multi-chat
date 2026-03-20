import { lazy, Suspense } from "react"
import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { isNil } from "es-toolkit"
import Placeholder from "@/pages/Chat/components/Placeholder"
import ModelSelectSkeleton from "@/pages/Chat/components/ModelSelect/Skeleton"
import PanelSkeleton from "@/pages/Chat/components/Panel/Skeleton"

const ModelSelect = lazy(() => import("@/pages/Chat/components/ModelSelect"))
const Panel = lazy(() => import("@/pages/Chat/components/Panel"))

/**
 * 聊天页面的具体内容
 */
const Content: React.FC = () => {
  const selectedChat = useCurrentSelectedChat()

  // 默认占位内容
  if (isNil(selectedChat)) {
    return <Placeholder />
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
    <Suspense fallback={<PanelSkeleton columnCount={selectedChat.chatModelList.length} />}>
      <Panel />
    </Suspense>
  )
}

export default Content

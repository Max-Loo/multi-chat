import { Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppDispatch } from "@/hooks/redux"
import { useCreateChat } from "@/hooks/useCreateChat"
import { toggleDrawer } from "@/store/slices/chatPageSlices"
import { useResponsive } from "@/hooks/useResponsive"
import { useTranslation } from "react-i18next"

/**
 * @description 聊天页面未选择聊天时的占位内容
 */
const ChatPlaceholder: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { createNewChat } = useCreateChat()
  const { isMobile } = useResponsive()

  // 打开抽屉
  const openDrawer = () => {
    dispatch(toggleDrawer())
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {isMobile && (
        <Button
          variant="ghost"
          className="absolute top-4 left-4 rounded h-8 w-8 p-0"
          onClick={openDrawer}
          aria-label="打开聊天列表"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Button
        variant="ghost"
        className="absolute top-4 right-4 rounded h-8 w-8 p-0"
        onClick={createNewChat}
        title={t(($) => $.chat.createChat)}
        aria-label="新增聊天"
      >
        <Plus size={16} />
      </Button>
      <div className="text-4xl">
        {t($ => $.chat.selectChatToStart)}
      </div>
    </div>
  )
}

export default ChatPlaceholder

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setIsCollapsed, setIsShowChatPage } from "@/store/slices/chatPageSlices";
import { PanelLeftOpen, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ChatPanelHeaderProps {
  columnCount: number;
  setColumnCount: (value: number) => void;
  isSplitter: boolean;
  setIsSplitter: (value: boolean) => void;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelHeader: React.FC<ChatPanelHeaderProps> = ({
  columnCount,
  setColumnCount,
  isSplitter,
  setIsSplitter,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const isSidebarCollapsed = useAppSelector(state => state.chatPage.isSidebarCollapsed)

  // 展开侧边栏
  const expandSidebar = () => {
    dispatch(setIsCollapsed(false))
  }

  const {
    selectedChat,
    chatModelList,
  } = useTypedSelectedChat()

  // 记录是否打开了具体聊天页面
  useEffect(() => {
    dispatch(setIsShowChatPage(true))
    return () => {
      dispatch(setIsShowChatPage(false))
    }
  }, [dispatch])

  return (
    <div className="relative z-10 flex items-center justify-between w-full h-12 pl-3 pr-3 border-b border-gray-200">
      <div className="flex items-center justify-start">
        {isSidebarCollapsed && <Button
          variant="ghost"
          className="rounded mr-2 h-8 w-8 p-0"
          title={t($ => $.chat.showSidebar)}
          onClick={expandSidebar}
        >
          <PanelLeftOpen size={16} />
        </Button>}
        <span
          className="text-base"
        >
          {selectedChat.name || t($ => $.chat.unnamed)}
        </span>
      </div>
      {chatModelList.length > 1 && <div className="flex items-center justify-start text-sm">
        <span>{t($ => $.chat.enableSplitter)}</span>
        <Switch checked={isSplitter} onCheckedChange={setIsSplitter} className="mr-2" />
        <span>{t($ => $.chat.maxPerRow)}</span>
        <Input
          type="number"
          className="w-16 h-8"
          min={1}
          max={chatModelList.length || 1}
          value={columnCount}
          onChange={(e) => setColumnCount(Number(e.target.value) || chatModelList.length)}
        />
        <span className="ml-1">{t($ => $.chat.itemsUnit)}</span>
        <Button
          variant="ghost"
          className="ml-1 h-8 w-8 p-0"
          disabled={columnCount >= chatModelList.length}
          onClick={() => setColumnCount(columnCount + 1)}
        >
          <Plus size={16} />
        </Button>
        <Button
          variant="ghost"
          className="ml-1 h-8 w-8 p-0"
          disabled={columnCount <= 1}
          onClick={() => setColumnCount(columnCount - 1)}
        >
          <Minus size={16} />
        </Button>
      </div>}
    </div>
  )
}


export default ChatPanelHeader
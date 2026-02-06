import FilterInput from "@/components/FilterInput"
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useNavigateToChat } from "@/hooks/useNavigateToPage";
import { setIsCollapsed } from "@/store/slices/chatPageSlices";
import { createChat } from "@/store/slices/chatSlices";
import { ArrowLeft, PanelLeftClose, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isString } from "es-toolkit";
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from "react-i18next"

interface ToolsBarProps {
  // 传入的是字符串的时候才能启用搜索按钮
  filterText?: string;
  onFilterChange?: (value: string) => void;
}

const ToolsBar: React.FC<ToolsBarProps> = ({
  filterText,
  onFilterChange = () => {},
}) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const {
    navigateToChat,
  } = useNavigateToChat()

  const isShowChatPage = useAppSelector(state => state.chatPage.isShowChatPage)

  // 是否展示搜索状态
  const [isSearching, setIsSearching] = useState(false)

  // 创建新的聊天
  const handleCreateChat = async () => {
    const chat = {
      id: uuidv4(),
      name: '',
    }

    dispatch(createChat({ chat }))
    // 创建成功后跳转到新建的聊天
    navigateToChat({
      chatId: chat.id,
    })
  }

  if (isSearching) {
    // 点击返回退出搜索
    const quitSearch = () => {
      setIsSearching(false)
      // 重置搜索的关键字
      onFilterChange('')
    }

    // 当开启搜索的时候，变更渲染内容
    return <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        className="rounded-lg p-1 h-8 w-8"
        onClick={quitSearch}
      >
        <ArrowLeft size={16} />
      </Button>
      <FilterInput
        value={filterText || ''}
        onChange={(value) => {
          onFilterChange(value)
        }}
        className="w-fit ml-2"
        autoFocus
      />
    </div>
  }

  // 隐藏聊天页侧边栏
  const collapseSidebar = () => {
    dispatch(setIsCollapsed(true))
  }

  return (
    <div className="flex items-center justify-between w-full">
      {isShowChatPage ? <Button
        variant="ghost"
        className="rounded h-8 w-8 p-0"
        title={t($ => $.chat.hideSidebar)}
        onClick={collapseSidebar}
      >
        <PanelLeftClose size={16} />
      </Button> : <div></div>}
      <div className="flex">
        {/* 传入一个正常的字符串才表示启用搜索按钮 */}
        {isString(filterText) && <Button
          variant="ghost"
          className="rounded-lg h-8 w-8 p-0"
          title={t($ => $.common.search)}
          onClick={() => setIsSearching(true)}
        >
          <Search size={16} />
        </Button>}
        <Button
          variant="ghost"
          className="rounded-lg ml-1 h-8 w-8 p-0"
          onClick={handleCreateChat}
          title={t($ => $.chat.createChat)}
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  )
}

export default ToolsBar
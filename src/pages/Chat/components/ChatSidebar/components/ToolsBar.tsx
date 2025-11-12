import FilterInput from "@/components/FilterInput"
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setIsCollapsed } from "@/store/slices/chatPageSlices";
import { createChat, setSelectedChatId } from "@/store/slices/chatSlices";
import { LeftOutlined, MenuFoldOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { isString } from "es-toolkit";
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid'

interface ToolsBarProps {
  // 传入的是字符串的时候才能启用搜索按钮
  filterText?: string;
  onFilterChange?: (value: string) => void;
}

const ToolsBar: React.FC<ToolsBarProps> = ({
  filterText,
  onFilterChange = () => {},
}) => {
  const dispatch = useAppDispatch()

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
    dispatch(setSelectedChatId(chat.id))
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
        className="rounded-lg! p-1!"
        icon={<LeftOutlined />}
        onClick={quitSearch}
      />
      <FilterInput
        value={filterText || ''}
        onChange={(value) => {
          onFilterChange(value)
        }}
        className="w-fit! ml-2"
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
        className="rounded-lg! pr-5! pl-5!"
        icon={<MenuFoldOutlined />}
        onClick={collapseSidebar}
      /> : <div></div>}
      <div className="flex">
        {/* 传入一个正常的字符串才表示启用搜索按钮 */}
        {isString(filterText) && <Button
          className="rounded-lg!"
          icon={<SearchOutlined />}
          onClick={() => setIsSearching(true)}
        />}
        <Button
          className="rounded-lg! ml-1"
          icon={<PlusOutlined />}
          onClick={handleCreateChat}
        />
      </div>
    </div>
  )
}

export default ToolsBar
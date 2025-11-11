import ToolsBar from "./components/ToolsBar"
import { Spin } from "antd"
import { useState } from "react"
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter"
import { useAppSelector } from "@/hooks/redux"
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import ChatButton from "./components/ChatButton"

const ChatSidebar: React.FC = () => {

  const {
    chatList,
    loading: chatListLoading,
  } = useAppSelector((state) => state.chat)

  // 控制滚动条的相关逻辑
  const {
    onScrollEvent,
    scrollbarClassname,
  } = useAdaptiveScrollbar()

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('')
  const {
    filteredList: filteredChatList,
  } = useDebouncedFilter(
    filterText,
    chatList,
    (chat) => chat.name?.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  )

  return (
    <div className="relative flex flex-col items-center justify-start w-full h-full">
      <div className="w-full h-12 p-2 border-b border-gray-100">
        <ToolsBar
          filterText={filterText}
          onFilterChange={setFilterText}
        />
      </div>
      <div
        className={`pb-2 overflow-y-auto w-full
          ${scrollbarClassname}
        `}
        onScroll={onScrollEvent}
      >
        {/* 带有 loading 效果 */}
        {!chatListLoading ? filteredChatList.map(chat => {
          return <ChatButton
            chat={chat}
            key={chat.id}
          />
        }) : <Spin spinning={chatListLoading} tip="加载中">
          <div className="w-full min-h-40"></div>
        </Spin>}
      </div>
      {/* 底部白色遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent" />
    </div>
  )
}


export default ChatSidebar
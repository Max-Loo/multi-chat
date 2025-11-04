import ToolsBar from "./ToolsBar"
import { Button, Spin } from "antd"
import { useState } from "react"
import { debounce } from "es-toolkit"
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { setSelectChat } from "@/store/slices/chatSlices"

// interface ChatSidebarProps {
// }

const ChatSidebar: React.FC = ({}) => {
  const dispatch = useAppDispatch()

  const {
    chatList,
    loading: chatListLoading,
    selectedChat,
  } = useAppSelector((state) => state.chat)

  const [isScrolling, setIsScrolling] = useState(false)
  // 在滚动的时候展示滚动条
  const showScrollbar = debounce(() => {
    setIsScrolling(true)
  }, 500, {
    edges: ['leading'],
  })

  // 在停止滚动后隐藏滚动条
  const hideScrollbar = debounce(() => {
    setIsScrolling(false)
  }, 500, {
    edges: ['trailing'],
  })

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('')
  const {
    filteredList: filteredChatList,
  } = useDebouncedFilter(
    filterText,
    chatList,
    (chat) => chat.name?.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  )

  // 创建新的聊天
  const handleCreateChat = () => {
    // const id = uuidV4()
    // setChatList([{
    //   id,
    //   name: '',
    // }, ...chatList])
    // onChatIdChange(id)
  }

  return (
    <div className="flex flex-col items-center justify-start h-full w-60">
      <div className="w-full p-2 border-b border-gray-100">
        <ToolsBar
          filterText={filterText}
          onFilterChange={setFilterText}
          onClickCreateChat={handleCreateChat}
        />
      </div>
      <div
        className={`pb-2 overflow-y-auto w-full
          ${isScrolling ? 'scrollbar-thin' : 'scrollbar-none'}`
        }
        onScroll={() => {
          showScrollbar()
          hideScrollbar()
        }}
      >
        {!chatListLoading ? filteredChatList.map(chat => {
          return (
            <Button
              key={chat.id}
              type="text"
              className={`w-full py-5! flex justify-start! rounded-none! ${
                chat.id === selectedChat?.id && 'bg-gray-200!'
              }`}
              onClick={() => dispatch(setSelectChat(chat))}
            >
              <span className="pl-2 text-base">{chat.name || '未命名'}</span>
            </Button>
          )
        }) : <Spin spinning={chatListLoading} tip="加载中">
            <div className="w-full min-h-40"></div>
          </Spin>}
      </div>
    </div>
  )
}


export default ChatSidebar
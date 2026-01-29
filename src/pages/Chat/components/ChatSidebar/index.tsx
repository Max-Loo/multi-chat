import ToolsBar from "./components/ToolsBar"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useRef, useEffect } from "react"
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter"
import { useAppSelector } from "@/hooks/redux"
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import ChatButton from "./components/ChatButton"
import { useExistingChatList } from "@/hooks/useExistingChatList"

const ChatSidebar: React.FC = () => {
  const chatList = useExistingChatList()
  const chatListLoading = useAppSelector((state) => state.chat.loading)

  // 控制滚动条的相关逻辑
  const {
    onScrollEvent,
    scrollbarClassname,
  } = useAdaptiveScrollbar()

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('')

  // 滚动容器 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    filteredList: filteredChatList,
  } = useDebouncedFilter(
    filterText,
    chatList,
    (chat) => chat.name?.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  )

  // 添加 passive 监听器
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', onScrollEvent, { passive: true })

    return () => {
      container.removeEventListener('scroll', onScrollEvent)
    }
  }, [onScrollEvent])

  return (
    <div className="relative flex flex-col items-center justify-start w-full h-full">
      <div className="w-full h-12 p-2 border-b border-gray-100">
        <ToolsBar
          filterText={filterText}
          onFilterChange={setFilterText}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className={`pb-2 overflow-y-auto w-full
          ${scrollbarClassname}
        `}
      >
        {/* 带有 loading 效果 */}
        {!chatListLoading ? filteredChatList.map(chat => {
          return <ChatButton
            chat={chat}
            key={chat.id}
          />
        }) : (
          <div className="w-full p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


export default ChatSidebar
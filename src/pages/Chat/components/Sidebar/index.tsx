import ToolsBar from "./components/ToolsBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useCallback } from "react";
import { ChatMeta } from "@/types/chat"
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter";
import { useAppSelector } from "@/hooks/redux";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";
import ChatButton from "./components/ChatButton";
import { useExistingChatList } from "@/hooks/useExistingChatList";
import { VList } from "virtua";

/**
 * 聊天侧边栏组件
 */
const Sidebar: React.FC = () => {
  const chatMetaList = useExistingChatList();
  const chatListLoading = useAppSelector((state) => state.chat.loading);
  const selectedChatId = useAppSelector((state) => state.chat.selectedChatId);

  const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

  const [filterText, setFilterText] = useState<string>("");

  const filterPredicate = useCallback(
    (meta: ChatMeta) => meta.name?.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
    [filterText]
  )

  const { filteredList: filteredChatList } = useDebouncedFilter(
    filterText,
    chatMetaList,
    filterPredicate,
  );

  return (
    <div className="relative flex flex-col items-center justify-start w-full h-full">
      <div className="w-full h-12 p-2 border-b border-gray-100">
        <ToolsBar filterText={filterText} onFilterChange={setFilterText} />
      </div>
      {!chatListLoading ? (
        <div className="flex-1 min-h-0 w-full">
          <VList
            className={`pb-2 w-full ${scrollbarClassname}`}
            onScroll={onScrollEvent}
          >
            {filteredChatList.map((meta) => {
              return (
                <ChatButton
                  chatMeta={meta}
                  key={meta.id}
                  isSelected={meta.id === selectedChatId}
                />
              );
            })}
          </VList>
        </div>
      ) : (
        <div className="w-full p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

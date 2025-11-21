import { ChatModel } from "@/types/chat"
import { useMemo } from "react";
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat";
import ChatPanelContentDetail from "./ChatPanelContentDetail";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";

interface ChatPanelContentProps {
  columnCount: number;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelContent: React.FC<ChatPanelContentProps> = ({
  columnCount,
}) => {
  // 控制滚动条的相关逻辑
  const {
    onScrollEvent,
    scrollbarClassname,
  } = useAdaptiveScrollbar()

  const {
    chatModelList,
  } = useTypedSelectedChat()

  // 将数组变成一个 n*m 的二维数组，每一行最多有 columnCount 个
  const board = useMemo<ChatModel[][]>(() => {
    const list: ChatModel[][] = []
    for (let i = 0; i < chatModelList.length; i += columnCount) {
      const element = chatModelList.slice(i, i + columnCount)
      list.push(element)
    }
    return list
  }, [columnCount, chatModelList])


  // 渲染成棋盘
  return <div className="absolute top-0 left-0 w-full h-screen pt-12 pb-22">
    <div className="flex flex-col w-full h-full">
      {board.map((row, idx) => {
        return <div
          className={`flex w-full flex-1 overflow-y-auto`}
          key={idx}
        >
          {row.map(chatModel => {
            return <div
              key={chatModel.modelId}
              className={`flex-1 overflow-y-auto border-b border-r border-gray-300
                pr-4 pl-4
                ${scrollbarClassname}
              `}
              onScroll={onScrollEvent}
            >
              {/* 具体渲染的内容 */}
              <ChatPanelContentDetail
                chatModel={chatModel}
              />
            </div>
          })}
        </div>
      })}
    </div>
  </div>
}

export default ChatPanelContent
import { ChatModel } from "@/types/chat"
import { useMemo } from "react";
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat";
import { useAppSelector } from "@/hooks/redux";

interface ChatPanelContentProps {
  columnCount: number;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelContent: React.FC<ChatPanelContentProps> = ({
  columnCount,
}) => {

  const {
    selectedChat,
    chatModelList,
  } = useTypedSelectedChat()


  // 当前在运行的聊天
  const runningChat = useAppSelector(state => state.chatModel.runningChat)

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
          {row.map(chat => {
            return <div
              key={chat.modelId}
              className="box-border h-full p-2 overflow-y-auto text-sm border-b border-r border-gray-300 grow"
            >
              {/* 具体渲染的内容 */}
              {chat.modelId}
              <div>---</div>
              { runningChat[selectedChat.id]?.[chat.modelId]?.historyList?.map((history, idx) => <div key={idx}>{history}</div>)
                || chat.chatHistoryList?.map((history, idx) => <div key={idx}>{history}</div>)
              }
            </div>
          })}
        </div>
      })}
    </div>
  </div>
}

export default ChatPanelContent
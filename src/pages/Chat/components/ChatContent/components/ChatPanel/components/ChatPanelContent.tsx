import { ChatModel } from "@/types/chat"
// import { Splitter } from "antd";
import { useMemo } from "react";

interface ChatPanelContentProps {
  // selectedChat: Chat;
  chatModelList: ChatModel[]
  columnCount: number;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelContent: React.FC<ChatPanelContentProps> = ({
  // selectedChat,
  chatModelList,
  columnCount,
}) => {

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
  return <>
    {/* <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
      {
        board.map((row, idx) => {
          return <Splitter.Panel
            key={idx}
          >
            <Splitter lazy onResizeEnd={(sizes) => console.log('column', sizes)}>
              {row.map(chat => {
                return <Splitter.Panel
                  key={chat.modelId}
                >
                  {chat.modelId}
                </Splitter.Panel>
              })}
            </Splitter>
          </Splitter.Panel>
        })
      }
    </Splitter> */}
    {<div className="flex flex-col items-center justify-center h-full">
      {board.map((row, idx) => {
        return <div
          className="flex items-center justify-center w-full grow"
          key={idx}>
          {row.map(chat => {
            return <div
              key={chat.modelId}
              className="box-border h-full border-b border-r border-gray-300 grow"
            >
              {chat.modelId}
            </div>
          })}
        </div>
      })}
    </div>}
  </>
}

export default ChatPanelContent
import { ChatModel } from "@/types/chat"
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


  const str = `
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
    </Splitter> <Splitter layout="vertical" lazy onResizeEnd={(sizes) => console.log('row', sizes)}>
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
      }`

  // 渲染成棋盘
  return <div className="absolute top-0 left-0 w-full h-screen pt-12 pb-24">
    <div className="flex flex-col w-full h-full">
      {board.map((row, idx) => {
        return <div
          className={`flex w-full flex-1 overflow-y-auto`}
          key={idx}>
          {row.map(chat => {
            return <div
              key={chat.modelId}
              className="box-border h-full p-2 overflow-y-auto border-b border-r border-gray-300 grow"
            >
              {chat.modelId + str}

            </div>
          })}
        </div>
      })}
    </div>
  </div>
}

export default ChatPanelContent
import React, { useMemo } from "react";
import { ChatModel } from "@/types/chat";
import { useTypedSelectedChat } from "../../hooks/useTypedSelectedChat";
import ChatPanelContentDetail from "./components/ChatPanelContentDetail";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface ChatPanelContentProps {
  columnCount: number;
  isSplitter: boolean;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelContent: React.FC<ChatPanelContentProps> = ({
  columnCount,
  isSplitter,
}) => {
  const { chatModelList } = useTypedSelectedChat();

  // 将数组变成一个 n*m 的二维数组，每一行最多有 columnCount 个
  const board = useMemo<ChatModel[][]>(() => {
    const list: ChatModel[][] = [];
    for (let i = 0; i < chatModelList.length; i += columnCount) {
      const element = chatModelList.slice(i, i + columnCount);
      list.push(element);
    }
    return list;
  }, [columnCount, chatModelList]);

  // 开启手动拖拽窗口大小
  if (isSplitter && chatModelList.length > 1) {
    return (
      <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30">
        <ResizablePanelGroup orientation="vertical">
          {board.map((row, idx) => (
            <React.Fragment key={idx}>
              <ResizablePanel defaultSize={100 / board.length}>
                <ResizablePanelGroup orientation="horizontal">
                  {row.map((chatModel, cellIdx) => (
                    <React.Fragment key={chatModel.modelId}>
                      <ResizablePanel defaultSize={100 / row.length}>
                        <div className="relative h-full w-full">
                          {/* 具体渲染的内容 */}
                          <ChatPanelContentDetail chatModel={chatModel} />
                        </div>
                      </ResizablePanel>
                      {cellIdx < row.length - 1 && (
                        <ResizableHandle withHandle />
                      )}
                    </React.Fragment>
                  ))}
                </ResizablePanelGroup>
              </ResizablePanel>
              {idx < board.length - 1 && <ResizableHandle withHandle />}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      </div>
    );
  }

  // 渲染成棋盘
  return (
    <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30">
      <div className="flex flex-col w-full h-full">
        {board.map((row, idx) => {
          return (
            <div className={`flex w-full flex-1 overflow-y-hidden`} key={idx}>
              {row.map((chatModel, cellIdx) => {
                return (
                  <div
                    key={chatModel.modelId}
                    className={cn(
                      "relative flex-1 min-w-0 border-gray-300",
                      cellIdx < row.length - 1 && "border-r",
                      idx < board.length - 1 && "border-b",
                    )}
                  >
                    {/* 具体渲染的内容 */}
                    <ChatPanelContentDetail chatModel={chatModel} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatPanelContent;

import React from "react";
import { ChatModel } from "@/types/chat";
import { cn } from "@/utils/utils";
import Detail from "./Detail";

/**
 * 固定网格布局组件
 * @param board 二维数组，每行最多 columnCount 个模型
 */
interface GridProps {
  board: ChatModel[][];
}

const Grid: React.FC<GridProps> = ({ board }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30" data-testid="grid-container">
      <div className="flex flex-col w-full h-full">
        {board.map((row, idx) => (
          <div className="flex w-full flex-1 overflow-y-hidden" key={idx} data-testid="grid-row">
            {row.map((chatModel, cellIdx) => (
              <div
                key={chatModel.modelId}
                className={cn(
                  "relative flex-1 min-w-0 border-gray-300",
                  cellIdx < row.length - 1 && "border-r",
                  idx < board.length - 1 && "border-b",
                )}
              >
                <Detail chatModel={chatModel} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grid;

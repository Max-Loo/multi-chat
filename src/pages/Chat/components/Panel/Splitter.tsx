import React from "react";
import { ChatModel } from "@/types/chat";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Detail from "./Detail";

/**
 * 可拖拽布局组件
 * @param board 二维数组，每行最多 columnCount 个模型
 */
interface SplitterProps {
  board: ChatModel[][];
}

const Splitter: React.FC<SplitterProps> = ({ board }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30" data-testid="splitter-container">
      <ResizablePanelGroup orientation="vertical">
        {board.map((row, idx) => (
          <React.Fragment key={idx}>
            <ResizablePanel defaultSize={100 / board.length}>
              <ResizablePanelGroup orientation="horizontal">
                {row.map((chatModel, cellIdx) => (
                  <React.Fragment key={chatModel.modelId}>
                    <ResizablePanel defaultSize={100 / row.length}>
                      <div className="relative h-full w-full">
                        <Detail chatModel={chatModel} />
                      </div>
                    </ResizablePanel>
                    {cellIdx < row.length - 1 && <ResizableHandle withHandle />}
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
};

export default Splitter;

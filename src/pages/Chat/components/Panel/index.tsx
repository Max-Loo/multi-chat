import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import Header from "./Header";
import Grid from "./Grid";
import Sender from "./Sender";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Splitter 组件异步导入
 * 仅在用户启用可拖拽布局时加载，减少主 bundle 体积
 */
const Splitter = lazy(() => import("./Splitter"));
import { useSelectedChat } from "@/pages/Chat/hooks/useSelectedChat";
import { useBoard } from "@/pages/Chat/hooks/useBoard";

/**
 * 聊天面板组件
 */
const Panel: React.FC = () => {
  const { chatModelList } = useSelectedChat();

  // 控制每一行展示多少个聊天框
  const [columnCount, setColumnCount] = useState(() => chatModelList.length);

  // 是否启用自定义拖拽窗口
  const [isSplitter, setIsSplitter] = useState(false);

  // 当 chatModelList 变化时重置 isSplitter
  // 避免切换到只有 1 个模型的聊天时仍保持 Splitter 模式
  useEffect(() => {
    setIsSplitter(false);
  }, [chatModelList]);

  // 使用 useBoard hook 获取布局数据
  const { board, shouldUseSplitter } = useBoard(columnCount, isSplitter);

  // 显式条件渲染：根据 shouldUseSplitter 选择组件
  // 注意：切换布局会卸载/挂载组件，内部状态（如滚动位置）会丢失
  // 如果需要保持状态，应使用 CSS display:none 隐藏而非卸载
  const renderContent = useMemo(() => {
    if (shouldUseSplitter) {
      return (
        <Suspense
          fallback={
            <div className="absolute top-0 left-0 w-full h-full pt-12 pb-30">
              <div className="flex flex-col w-full h-full gap-2 p-4">
                {board.flat().map((_, idx) => (
                  <Skeleton key={idx} className="flex-1 rounded-lg" />
                ))}
              </div>
            </div>
          }
        >
          <Splitter board={board} />
        </Suspense>
      );
    }
    return <Grid board={board} />;
  }, [shouldUseSplitter, board]);

  return (
    <div className="relative flex flex-col items-center justify-start w-full h-full" data-testid="chat-panel">
      {/* 为了实现「上中下」的布局，内部采用 absolute 定位 ，为了保持层级正常，将组件写在最前面 */}
      {renderContent}
      {/* 头部 */}
      <Header
        columnCount={columnCount}
        setColumnCount={setColumnCount}
        isSplitter={isSplitter}
        setIsSplitter={setIsSplitter}
      />
      {/* 内容部分 */}
      <div className="flex flex-col w-full grow">{/* 仅占位 */}</div>
      {/* 发送框 */}
      <div className="w-full p-2">
        <Sender />
      </div>
    </div>
  );
};

export default Panel;

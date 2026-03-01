import { Skeleton } from "@/components/ui/skeleton"

/**
 * @description ChatPanel 组件的骨架屏
 *
 * 注意：此骨架屏应与 ChatPanel 组件的布局保持同步
 * 当 ChatPanel 的布局发生变化时，需要相应更新此骨架屏
 */
interface ChatPanelSkeletonProps {
  columnCount?: number
}

const ChatPanelSkeleton: React.FC<ChatPanelSkeletonProps> = ({
  columnCount = 1,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-start w-full h-full">
      {/* 头部骨架屏（高度 h-12） */}
      <div className="relative z-10 flex items-center justify-between w-full h-12 pl-3 pr-3 border-b">
        {/* 左侧区域：聊天名称 */}
        <div className="flex items-center justify-start">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* 右侧区域：列数控制（仅在多列时显示） */}
        {columnCount > 1 && (
          <div className="flex items-center justify-start text-sm gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-11" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        )}
      </div>

      {/* 聊天内容区域骨架屏（flex-grow） */}
      <div className="flex flex-col w-full grow">
        {/* 仅占位 */}
      </div>

      {/* 内容区域：多列消息气泡骨架屏 */}
      <div
        className="absolute inset-0 top-16 bottom-16 px-4"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: "1rem",
        }}
      >
        {/* 为每列渲染消息气泡骨架屏 */}
        {Array.from({ length: columnCount }).map((_, columnIndex) => (
          <div key={columnIndex} className="flex flex-col w-full h-full gap-3">
            {/* 模拟 2-3 个消息气泡 */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                {/* 用户消息气泡（右侧对齐） */}
                {i % 2 === 0 && (
                  <div className="flex justify-end">
                    <Skeleton
                      className="h-12 rounded-lg"
                      style={{ width: `${60 + columnIndex * 10}%` }}
                    />
                  </div>
                )}
                {/* AI 消息气泡（左侧对齐） */}
                {i % 2 !== 0 && (
                  <div className="flex justify-start">
                    <Skeleton
                      className="h-16 rounded-lg"
                      style={{ width: `${70 + columnIndex * 5}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 发送框区域骨架屏 */}
      <div className="relative z-10 w-full px-4 py-3 border-t">
        <div className="relative flex items-end gap-3">
          {/* 模拟 Textarea 输入框 */}
          <Skeleton className="flex-1 h-20 rounded-lg" />
          {/* 模拟圆形发送按钮 */}
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  )
}

export default ChatPanelSkeleton

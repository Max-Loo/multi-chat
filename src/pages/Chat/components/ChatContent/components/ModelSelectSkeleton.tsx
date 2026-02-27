import { Skeleton } from "@/components/ui/skeleton"

/**
 * @description ModelSelect 组件的骨架屏
 *
 * 注意：此骨架屏应与 ModelSelect 组件的布局保持同步
 * 当 ModelSelect 的布局发生变化时，需要相应更新此骨架屏
 */
const ModelSelectSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col w-full h-full">
      {/* 顶部操作栏骨架屏（高度 h-12） */}
      <div className="flex justify-between w-full h-12 pl-4 pr-4 border-b">
        {/* 左侧区域：已选模型标签预览 */}
        <div className="flex flex-wrap items-center justify-start h-full gap-2">
          {/* 模拟 Badge（已选模型标签）*/}
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* 右侧区域：确认按钮和搜索框 */}
        <div className="flex items-center justify-end h-full gap-2">
          {/* 模拟确认按钮 */}
          <Skeleton className="h-8 w-16 rounded-md" />
          {/* 模拟搜索框 */}
          <Skeleton className="h-8 w-72 rounded-md" />
        </div>
      </div>

      {/* 数据表格区域骨架屏 */}
      <div className="flex flex-col w-full p-4 gap-2">
        {/* 模拟表格行 */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center w-full gap-2">
            {/* 模拟复选框列 */}
            <Skeleton className="h-4 w-4" />
            {/* 模拟表格单元格 */}
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModelSelectSkeleton

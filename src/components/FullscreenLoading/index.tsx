import { Skeleton } from "@/components/ui/skeleton";

/**
 * 全屏加载组件
 * 用于显示全屏加载状态
 */
const FullscreenLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-dvh">
      <div className="flex flex-col items-center space-y-4">
        {/* 圆形加载动画 */}
        <Skeleton className="h-16 w-16 rounded-full animate-pulse" />
        {/* 加载文本 */}
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
};

export default FullscreenLoading;
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 初始化屏幕组件
 * 显示应用初始化过程中的加载动画
 */
const InitializationScreen: React.FC = () => {
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

export default InitializationScreen;

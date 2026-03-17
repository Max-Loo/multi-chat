import { Skeleton } from "@/components/ui/skeleton";
import { useResponsive } from "@/hooks/useResponsive";

/**
 * 侧边栏骨架屏组件
 *
 * 模拟 ChatSidebar 的结构：顶部工具栏区域 + 长条形列表项
 */
function SidebarSkeleton() {
  return (
    <div className="flex flex-col w-64 h-full bg-gray-50 border-r border-gray-200">
      {/* 顶部工具栏区域 */}
      <div className="w-full h-12 p-2 border-b border-gray-100">
        <Skeleton variant="text" className="w-full h-full" />
      </div>

      {/* 列表区域 - 长条形按钮样式 */}
      <div className="w-full p-2 space-y-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} variant="text" className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * 主内容区域骨架屏组件
 *
 * 模拟页面主内容的加载状态
 */
function MainContentSkeleton() {
  return (
    <div className="flex-1 h-full p-6 space-y-6 overflow-hidden">
      {/* 页面标题区域 */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/3 h-8" />
        <Skeleton variant="text" className="w-1/2 h-4" />
      </div>

      {/* 内容卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton variant="rect" className="h-32" />
        <Skeleton variant="rect" className="h-32" />
        <Skeleton variant="rect" className="h-32" />
      </div>

      {/* 列表区域 */}
      <div className="space-y-3">
        <Skeleton variant="text" className="w-full h-12" />
        <Skeleton variant="text" className="w-full h-12" />
        <Skeleton variant="text" className="w-full h-12" />
        <Skeleton variant="text" className="w-full h-12" />
      </div>
    </div>
  );
}

/**
 * 移动端底部导航占位
 *
 * 模拟 BottomNav 的高度占位
 */
function MobileBottomNavPlaceholder() {
  return <div className="h-16 bg-gray-50 border-t border-gray-200 shrink-0" />;
}

/**
 * 页面级骨架屏组件
 *
 * 用于 Layout 的 Suspense fallback，根据设备类型渲染不同布局
 *
 * @example
 * <Suspense fallback={<PageSkeleton />}>
 *   <Outlet />
 * </Suspense>
 */
function PageSkeleton() {
  const { isMobile } = useResponsive();

  if (isMobile) {
    // 移动端布局：主内容区域 + 底部导航占位
    return (
      <div className="flex flex-col h-screen bg-white">
        <MainContentSkeleton />
        <MobileBottomNavPlaceholder />
      </div>
    );
  }

  // 桌面端布局：侧边栏 + 主内容区域
  return (
    <div className="flex h-screen bg-white">
      <SidebarSkeleton />
      <MainContentSkeleton />
    </div>
  );
}

export { PageSkeleton, SidebarSkeleton, MainContentSkeleton };

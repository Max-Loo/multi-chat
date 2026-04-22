import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { PageSkeleton } from "@/components/Skeleton";
import { useResponsive } from "@/hooks/useResponsive";

interface LayoutProps {
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ className = "" }) => {
  const { isMobile } = useResponsive();

  return (
    <div
      data-testid="layout-root"
      className={`flex h-screen bg-white ${isMobile ? "flex-col" : ""} ${className}`}
    >
      {/* 侧边导航栏：在所有非 Mobile 模式下显示 (方案A) */}
      {!isMobile && <Sidebar />}

      {/* 主内容区域 */}
      <div role="main" data-testid="layout-main" className={`flex-1 overflow-y-hidden ${isMobile && "pb-16"}`}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>

      {/* 底部导航栏：仅在 Mobile 模式下显示 (方案A) */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;

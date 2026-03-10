import { Outlet } from "react-router-dom";
import SettingSidebar from "./components/SettingSidebar";
import SettingHeader from "./components/SettingHeader";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useResponsive } from "@/hooks/useResponsive";
import { MobileDrawer } from "@/components/MobileDrawer";
import { setIsDrawerOpen } from "@/store/slices/settingPageSlices";

/**
 * 设置页面
 * @description 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
const SettingPage: React.FC = () => {
  const { isMobile } = useResponsive();
  const isDrawerOpen = useAppSelector(
    (state) => state.settingPage.isDrawerOpen,
  );
  const dispatch = useAppDispatch();

  /**
   * @description 处理抽屉打开/关闭状态变化
   */
  const handleDrawerOpenChange = (open: boolean) => {
    dispatch(setIsDrawerOpen(open));
  };

  return (
    <div className="flex items-start justify-start w-full h-full relative">
      {/* 移动端：抽屉 */}
      {isMobile && (
        <>
          <MobileDrawer
            isOpen={isDrawerOpen}
            onOpenChange={handleDrawerOpenChange}
            showCloseButton={false}
          >
            <SettingSidebar />
          </MobileDrawer>
          <SettingHeader />
        </>
      )}

      {/* 桌面端：直接显示侧边栏（无折叠功能） */}
      {!isMobile && (
        <div className="w-64 h-full border-r border-gray-200 shrink-0">
          <SettingSidebar />
        </div>
      )}

      {/* 主内容区域 */}
      <div
        className={`flex-1 w-full h-full overflow-y-auto relative ${isMobile && "pt-12"}`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default SettingPage;

import { useAppDispatch } from "@/hooks/redux";
import { useResponsive } from "@/hooks/useResponsive";
import { toggleDrawer } from "@/store/slices/settingPageSlices";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

/**
 * 设置页面 Header 组件
 * @description 在移动端显示菜单按钮，用于打开设置侧边栏抽屉
 */
const SettingHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  /**
   * 打开抽屉
   */
  const openDrawer = () => {
    dispatch(toggleDrawer());
  };

  return (
    <div className="flex items-center w-full h-12 px-4 border-b border-gray-200 fixed top-0 left-0 bg-white z-10">
      {isMobile && (
        <Button
          variant="ghost"
          className="rounded mr-2 h-8 w-8 p-0"
          onClick={openDrawer}
          aria-label={t(($) => $.setting.openMenu)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <h1 className="text-base font-semibold">{t(($) => $.setting.title)}</h1>
    </div>
  );
};

export default SettingHeader;

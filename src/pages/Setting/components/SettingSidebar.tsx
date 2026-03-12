import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";
import { Button } from "@/components/ui/button";
import { useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useResponsive } from "@/hooks/useResponsive";

interface SettingButton {
  name: string;
  path: string;
}

/**
 * 设置页面侧边栏
 * @description 支持按钮压缩：根据屏幕尺寸调整按钮高度和文字大小
 */
const SettingSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDesktop } = useResponsive();

  // 用来标识当前选中的哪个按钮
  const selectedBtnPath = useMemo<string | null | undefined>(() => {
    const key = location.pathname.split("/")[2];
    return key;
  }, [location]);
  const { t } = useTranslation();

  const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

  // 滚动容器 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 需要渲染的按钮列表
  const settingList = useMemo<SettingButton[]>(() => {
    const list = [
      {
        name: t(($) => $.setting.generalSetting),
        path: "common",
      },
    ];

    // 仅开发环境显示 Toast 测试按钮
    if (import.meta.env.DEV) {
      list.push({
        name: t(($) => $.setting.toastTest),
        path: "toast-test",
      });
    }

    return list;
  }, [t]);

  // 点击某一类设置按钮的回调
  const onClickSettingBtn = (btn: SettingButton) => {
    const { path } = btn;

    if (selectedBtnPath === path) return;

    navigate(path);
  };

  // 添加 passive 监听器
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", onScrollEvent, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScrollEvent);
    };
  }, [onScrollEvent]);

  // 按钮样式根据屏幕尺寸压缩（参考 ChatButton 的压缩逻辑）
  const buttonClassName = `w-full mb-2 ${
    !isDesktop ? "h-9 text-sm" : "h-11 text-base"
  }`;

  return (
    <div
      ref={scrollContainerRef}
      className={`p-2 overflow-y-auto w-full h-full
      flex flex-col justify-start items-center
      ${scrollbarClassname}
    `}
    >
      {settingList.map((item) => {
        return (
          <Button
            key={item.path}
            variant="default"
            size="lg"
            className={buttonClassName}
            onClick={() => onClickSettingBtn(item)}
          >
            {item.name}
          </Button>
        );
      })}
    </div>
  );
};

export default SettingSidebar;

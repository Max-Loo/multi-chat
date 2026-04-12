import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setAutoNamingEnabled } from "@/store/slices/appConfigSlices";
import { selectAutoNamingEnabled } from "@/store/slices/appConfigSlices";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

/**
 * 自动命名开关设置组件
 * 允许用户切换自动命名功能的开启/关闭状态
 */
const AutoNamingSetting: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const autoNamingEnabled = useAppSelector(selectAutoNamingEnabled);

  /**
   * 切换自动命名开关状态
   * @param checked 新的开关状态
   */
  const handleToggle = (checked: boolean) => {
    dispatch(setAutoNamingEnabled(checked));
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* 左侧：标题和说明 */}
      <div className="flex flex-col gap-1">
        <div className="text-base">{t($ => $.setting.autoNaming.title)}</div>
        <div className="text-sm text-muted-foreground">
          {t($ => $.setting.autoNaming.description)}
        </div>
      </div>

      {/* 右侧：开关控件 */}
      <Switch
        checked={autoNamingEnabled}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};

export default AutoNamingSetting;

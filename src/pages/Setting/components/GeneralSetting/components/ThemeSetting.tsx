import { useTranslation } from "react-i18next";
import { useTheme, type Theme } from "@/hooks/useTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * 主题切换设置组件
 * 提供浅色/深色/跟随系统三个选项
 */
const ThemeSetting: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col gap-1">
        <div className="text-base">{t(($) => $.setting.theme.title)}</div>
        <div className="text-sm text-muted-foreground">
          {t(($) => $.setting.theme.description)}
        </div>
      </div>
      <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            {t(($) => $.setting.theme.light)}
          </SelectItem>
          <SelectItem value="dark">
            {t(($) => $.setting.theme.dark)}
          </SelectItem>
          <SelectItem value="system">
            {t(($) => $.setting.theme.system)}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeSetting;

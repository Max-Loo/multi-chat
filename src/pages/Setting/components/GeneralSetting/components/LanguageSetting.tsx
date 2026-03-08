import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setAppLanguage } from "@/store/slices/appConfigSlices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { changeAppLanguage } from "@/lib/i18n";
import { LOCAL_STORAGE_LANGUAGE_KEY } from "@/lib/global";
import { toast } from "sonner";

// 语言选项配置
const LANGUAGE_OPTIONS = [
  { value: "zh", label: "🇨🇳 中文" },
  { value: "en", label: "🇺🇸 English" },
  { value: "fr", label: "🇫🇷 Français" },
] as const;

interface LanguageSettingProps {
  className?: string;
}

const LanguageSetting: React.FC<LanguageSettingProps> = ({
  className,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const language = useAppSelector(state => state.appConfig.language)

  // 添加 isChanging 状态
  const [isChanging, setIsChanging] = useState(false);

  // 修改 onLangChange 为异步函数
  const onLangChange = async (lang: string) => {
    // 在函数开始时检查
    if (lang === language || isChanging) return;

    // 在切换开始时设置 isChanging(true)
    setIsChanging(true);

    try {
      // 调用 i18n 的语言切换函数
      const { success } = await changeAppLanguage(lang);
      
      if (success) {
        // 切换成功，更新 Redux store 和 localStorage
        dispatch(setAppLanguage(lang));
        try {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
        } catch (error) {
          console.warn('Failed to save language to localStorage:', error);
        }
      } else {
        // 切换失败，显示错误提示
        toast.error(t($ => ($.setting as any).languageSwitchFailed));
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error(t($ => ($.setting as any).languageSwitchFailed));
    } finally {
      // 在 try-finally 中恢复状态
      setTimeout(() => setIsChanging(false), 500);
    }
  };

  return <div className={`
    flex items-center justify-between w-full text-base
    ${className}
  `}>
    <div>{t($ => $.common.language)}</div>
    {/* 在 Select 组件上添加 disabled={isChanging} 属性 */}
    <Select value={language} onValueChange={onLangChange} disabled={isChanging}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div>{option.label}</div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
}

export default LanguageSetting

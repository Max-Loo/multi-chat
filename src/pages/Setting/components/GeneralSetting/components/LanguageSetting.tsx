import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setAppLanguage } from "@/store/slices/appConfigSlices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next"

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

  // 选择的「语言」发生改变的回调
  // @param lang 选中的语言
  const onLangChange = (lang: string) => {
    dispatch(setAppLanguage(lang))
  }

  return <div className={`
    flex items-center justify-between w-full text-base
    ${className}
  `}>
    <div>{t($ => $.common.language)}</div>
    <Select value={language} onValueChange={onLangChange}>
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

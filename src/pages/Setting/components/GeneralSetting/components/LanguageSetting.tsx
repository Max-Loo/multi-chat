import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setAppLanguage } from "@/store/slices/appConfigSlices";
import { Select } from "antd";
import { useTranslation } from "react-i18next"

interface LanguageSettingProps {
  className?: string;
}


const langOptions = [
  {
    label: <div>🇨🇳 中文</div>,
    value: 'zh',
  },
  {
    label: <div>🇺🇸 English</div>,
    value: 'en',
  },
]

const LanguageSetting: React.FC<LanguageSettingProps> = ({
  className,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const language = useAppSelector(state => state.appConfig.language)

  // 选择的「语言」发生改变的回调
  const onLangChange = (lang: string) => {
    console.log(lang);
    dispatch(setAppLanguage(lang))
  }

  return <div className={`
    flex items-center justify-between w-full text-base
    ${className}
  `}>
    <div>{t($ => $.common.language)}</div>
    <Select
      className="min-w-32!"
      value={language}
      options={langOptions}
      onChange={onLangChange}
    />
  </div>
}

export default LanguageSetting
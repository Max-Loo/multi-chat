import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";
import { Button } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom"

interface SettingButton {
  name: string;
  path: string;
}

const SettingSidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // 用来标识当前选中的哪个按钮
  const selectedBtnPath = useMemo<string | null | undefined>(() => {
    const key = location.pathname.split('/')[2]
    return key
  }, [location])
  const { t } = useTranslation()

  const {
    onScrollEvent,
    scrollbarClassname,
  } = useAdaptiveScrollbar()

  // 需要渲染的按钮列表
  const settingList = useMemo<SettingButton[]>(() => {
    return [
      {
        name: t($ => $.setting.generalSetting),
        path: 'common',
      },
    ]
  }, [t])

  // 点击某一类设置按钮的回调
  const onClickSettingBtn = (btn: SettingButton) => {
    const {
      path,
    } = btn

    if (selectedBtnPath === path) return

    navigate(path)
  }

  return <div
    className={`p-2 overflow-y-auto w-full h-full
      flex flex-col justify-start items-center
      ${scrollbarClassname}
    `}
    onScroll={onScrollEvent}
  >
    {settingList.map(item => {
      return <Button
        key={item.path}
        color="default"
        variant="filled"
        size="large"
        className={`
          w-full mb-2
          ${selectedBtnPath === item.path && 'bg-gray-300!'}
          hover:bg-gray-200!
        `}
        onClick={() => onClickSettingBtn(item)}
      >
        {item.name}
      </Button>
    })}
  </div>
}


export default SettingSidebar
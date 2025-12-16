import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import LanguageSetting from "./components/LanguageSetting"

const GeneralSetting: React.FC = () => {

  const {
    scrollbarClassname,
    onScrollEvent,
  } = useAdaptiveScrollbar()

  return <div
    className={`flex flex-col items-center justify-start 
      w-full h-full px-4
      overflow-y-auto bg-gray-100
      ${scrollbarClassname}
    `}
    onScroll={onScrollEvent}
  >
    <div className={`
      w-full p-3 my-4 bg-white rounded-xl
      flex flex-col justify-start items-center
    `}>
      <LanguageSetting />
    </div>
  </div>
}


export default GeneralSetting
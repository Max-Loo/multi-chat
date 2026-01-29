import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar"
import LanguageSetting from "./components/LanguageSetting"
import { useRef, useEffect } from "react"

const GeneralSetting: React.FC = () => {

  const {
    scrollbarClassname,
    onScrollEvent,
  } = useAdaptiveScrollbar()

  // 滚动容器 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 添加 passive 监听器
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', onScrollEvent, { passive: true })

    return () => {
      container.removeEventListener('scroll', onScrollEvent)
    }
  }, [onScrollEvent])

  return <div
    ref={scrollContainerRef}
    className={`flex flex-col items-center justify-start
      w-full h-full px-4
      overflow-y-auto bg-gray-100
      ${scrollbarClassname}
    `}
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
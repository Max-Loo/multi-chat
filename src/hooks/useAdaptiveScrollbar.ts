import { isNull } from "es-toolkit";
import { useCallback, useMemo, useRef, useState } from "react";

interface useAdaptiveScrollbarParams {
  // 隐藏防抖延迟
  hideDebounceMs?: number;
}

/**
 * @description 处理自适应滚动条的逻辑
 */
export const useAdaptiveScrollbar = ({
  /** 入参 */
  hideDebounceMs = 500,
}: useAdaptiveScrollbarParams = {}) : {
  // 通过类来控制 scrollbar 样式
  scrollbarClassname: string;
  // 触发滚动事件
  onScrollEvent: () => void;
  // 是否处于滚动中，当外部需要该状态做一些判断的时候可以使用
  isScrolling: boolean;
} => {
  // 控制当前是否滚动
  const [isScrolling, setIsScrolling] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  // 在滚动的时候展示滚动条
  const showScrollbar = useCallback(() => {
    // 避免重复设置
    if (!isScrolling) {
      setIsScrolling(true)
    }

    // 如果上一个计时器还没有执行的话
    if (!isNull(timeoutRef.current)) {
      // 清除上一个计时器
      clearTimeout(timeoutRef.current)
    }

    // 重新开始计时
    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, hideDebounceMs);
  }, [hideDebounceMs, isScrolling])

  // 由类名来控制是否展示滚动条
  const scrollbarClassname = useMemo(() => {
    return isScrolling ? 'scrollbar-thin' : 'scrollbar-none'
  }, [isScrolling])

  return {
    scrollbarClassname,
    isScrolling,
    onScrollEvent: () => {
      showScrollbar()
    },
  }
}
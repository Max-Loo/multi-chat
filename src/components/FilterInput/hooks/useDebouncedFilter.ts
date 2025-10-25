import { debounce } from "es-toolkit"
import { useEffect, useState } from "react"

/**
 * 带防抖的过滤Hook，用于实现带有延迟过滤功能的自定义Hook
 * @param text 过滤文本，用于匹配列表项的搜索关键字
 * @param list 原始数据列表，需要进行过滤的数据数组
 * @param predicate 过滤条件函数，该函数接受最多三个参数。filter方法为数组中的每个元素调用一次谓词函数。
 * @param debounceMs 防抖延迟时间，默认200毫秒
 */
export const useDebouncedFilter = <T>(
  text: string,
  list: T[],
  predicate: (value: T, index: number, list: T[]) => unknown,
  debounceMs: number = 200,
) => {
  // 存储过滤后的列表状态
  const [filteredList, setFilteredList] = useState(list)

  useEffect(() => {
    // 创建防抖过滤函数，避免在用户快速输入时频繁执行过滤操作
    const debouncedFilter = debounce(() => {
      // 如果没有过滤文本，则显示完整的原始列表
      if (!text) {
        setFilteredList(list)
      } else {
        // 根据谓词函数过滤列表，只保留满足条件的项
        setFilteredList(list.filter(predicate))
      }
    }, debounceMs)

    // 立即执行一次防抖函数
    debouncedFilter()

    // 清理函数：在组件卸载或依赖项变化时取消未执行的防抖函数
    return () => {
      debouncedFilter.cancel()
    }
  }, [text, list, debounceMs, predicate]) // 依赖项：当过滤文本或原始列表变化时重新执行效果

  return {
    filteredList, // 返回过滤后的列表数据
  }
}
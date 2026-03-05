/**
 * @description URL 相关工具函数
 */

/**
 * 清除 URLSearchParams 中的指定参数
 * @param paramKeys 要清除的参数名数组
 * @param searchParams 当前的 URLSearchParams 对象
 * @returns 新的 URLSearchParams 对象
 * @example
 * ```typescript
 * const params = new URLSearchParams('chatId=123&other=456')
 * const cleaned = clearUrlSearchParams(['chatId'], params)
 * console.log(cleaned.toString()) // 'other=456'
 * ```
 */
export const clearUrlSearchParams = (
  paramKeys: string[],
  searchParams: URLSearchParams
): URLSearchParams => {
  const newParams = new URLSearchParams(searchParams)
  paramKeys.forEach(key => newParams.delete(key))
  return newParams
}

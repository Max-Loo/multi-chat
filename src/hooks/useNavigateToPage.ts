/**
 * @description 跳转到聊天页面（带参数）
 */

import { useNavigate, useSearchParams, type NavigateOptions } from "react-router-dom"
import { clearUrlSearchParams } from "@/utils/urlUtils"

interface NavigateToChatOptions extends NavigateOptions {
  chatId?: string;
}

export const useNavigateToChat = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const navigateToChat = ({
    chatId,
    ...options
  }: NavigateToChatOptions = {}) => {
    const path = chatId
      ? `/chat?${new URLSearchParams({ chatId }).toString()}`
      : '/chat'
    navigate(path, options)
  }

  /**
   * 清除 URL 中的 chatId 参数
   */
  const clearChatIdParam = () => {
    const newParams = clearUrlSearchParams(['chatId'], searchParams)
    setSearchParams(newParams)
  }

  return {
    navigateToChat,
    clearChatIdParam,
  }
}
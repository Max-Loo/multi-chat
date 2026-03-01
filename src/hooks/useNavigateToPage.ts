/**
 * @description 跳转到聊天页面（带参数）
 */

import { useNavigate, type NavigateOptions } from "react-router-dom"

interface NavigateToChatOptions extends NavigateOptions {
  chatId?: string;
}

export const useNavigateToChat = () => {
  const navigate = useNavigate()

  const navigateToChat = ({
    chatId,
    ...options
  }: NavigateToChatOptions = {}) => {
    const path = chatId
      ? `/chat?${new URLSearchParams({ chatId }).toString()}`
      : '/chat'
    navigate(path, options)
  }

  return {
    navigateToChat,
  }
}
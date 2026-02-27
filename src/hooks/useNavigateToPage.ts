/**
 * @description 跳转到聊天页面（带参数）
 */

import { useNavigate, type NavigateOptions } from "react-router-dom"

interface NavigateToChatOptions extends NavigateOptions {
  chatId: string;
}

export const useNavigateToChat = () => {
  const navigate = useNavigate()

  const navigateToChat = ({
    chatId,
    ...options
  }: NavigateToChatOptions) => {
    // 跳转到对应的聊天详情
    navigate(`/chat?${new URLSearchParams({
      chatId,
    }).toString()}`, options)
  }

  // 清除查询参数，跳转到聊天页面
  const navigateToChatWithoutParams = (options?: NavigateOptions) => {
    navigate('/chat', options)
  }

  return {
    navigateToChat,
    navigateToChatWithoutParams,
  }
}
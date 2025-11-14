/**
 * @description 跳转到聊天页面（带参数）
 */

import { useNavigate } from "react-router-dom"

interface navigateToChatProps {
  chatId: string;
}

export const useNavigateToChat = () => {
  const navigate = useNavigate()

  const navigateToChat = ({
    chatId,
  }: navigateToChatProps) => {
    // 跳转到对应的聊天详情
    navigate(`/chat?${new URLSearchParams({
      chatId,
    }).toString()}`)
  }
  return {
    navigateToChat,
  }
}
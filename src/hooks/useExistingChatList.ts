import { useAppSelector } from "./redux"

/**
 * @description 获取不包含删除了的聊天的 chatList
 */
export const useExistingChatList = () => {
  return useAppSelector(state => {
    return state.chat.chatList.filter(chat => {
      return !chat.isDeleted
    })
  })
}
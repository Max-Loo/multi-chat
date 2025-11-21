import { useAppSelector } from "./redux"

/**
 * @description 获取不包含删除了的聊天的 chatList
 */
export const useExistingModels = () => {
  return useAppSelector(state => {
    return state.models.models.filter(model => {
      return !model.isDeleted
    })
  })
}


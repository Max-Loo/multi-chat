import { useMemo } from "react"
import { useAppSelector } from "./redux"

/**
 * @description 获取不包含删除了的聊天的 chatList
 */
export const useExistingModels = () => {
  const models = useAppSelector(state => state.models.models)

  return useMemo(() => {
    return models.filter(model => {
      return !model.isDeleted
    })
  }, [models])
}


import { ChatRoleEnum } from "@/types/chat"
import { isNil } from "es-toolkit"

/**
 * @description 将字面量的角色字符串转换成枚举值
 * @param role 角色字符串
 * @returns ChatRoleEnum.xxx
 */
export const getStandardRole = (role?: string): ChatRoleEnum => {
  if (isNil(role)) {
    return ChatRoleEnum.UNKNOWN
  }


  const roleMap = new Map<string, ChatRoleEnum>(Object.values(ChatRoleEnum).map(item => {
    return [item, item]
  }))

  return roleMap.get(role) ?? ChatRoleEnum.UNKNOWN
}
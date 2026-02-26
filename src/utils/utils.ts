import { ChatRoleEnum } from "@/types/chat"
import { isNil } from "es-toolkit"

/**
 * 获取当前 Unix 时间戳（秒级精度）
 * @returns Unix 时间戳，表示从 1970-01-01 00:00:00 UTC 到当前时间的秒数
 * @example
 * ```typescript
 * const timestamp = getCurrentTimestamp();
 * console.log(timestamp); // 例如: 1737888000
 * ```
 */
export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
}

/**
 * 获取当前 Unix 时间戳（毫秒级精度）
 * @returns Unix 时间戳，表示从 1970-01-01 00:00:00 UTC 到当前时间的毫秒数
 * @example
 * ```typescript
 * const timestamp = getCurrentTimestampMs();
 * console.log(timestamp); // 例如: 1737888000000
 * ```
 */
export const getCurrentTimestampMs = (): number => {
  return Date.now();
}

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
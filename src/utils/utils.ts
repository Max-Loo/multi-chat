import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
 * 合并 Tailwind CSS 类名（处理冲突和条件类名）
 * @param inputs 类名列表
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

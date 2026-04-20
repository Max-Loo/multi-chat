/**
 * localStorage 轮询等待工具
 *
 * 替代固定延时 setTimeout(resolve, N)，轮询检查 localStorage 值更可靠
 */

import { waitFor } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * 等待 localStorage 中某个 key 变为期望值
 *
 * @param key localStorage 键名
 * @param expectedValue 期望值（传 null 表示等待键被删除）
 * @param options 轮询选项
 */
export async function waitForLocalStorage(
  key: string,
  expectedValue: string | null,
  options?: { timeout?: number; interval?: number },
) {
  await waitFor(() => {
    expect(localStorage.getItem(key)).toBe(expectedValue);
  }, { timeout: 1000, interval: 10, ...options });
}

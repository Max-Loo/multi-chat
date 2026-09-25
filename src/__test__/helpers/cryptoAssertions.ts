/**
 * WebCrypto 相关测试断言辅助
 *
 * 收敛 crypto.test.ts 与 keyringMigration.test.ts 中对
 * subtle.importKey / subtle.deriveKey 第 4 参数（extractable）的重复断言
 */

import { expect, vi } from 'vitest';

/**
 * 断言指定 spy 的某次调用以 extractable=false 导入/派生密钥
 *
 * @param spy vi.spyOn(crypto.subtle, 'importKey' | 'deriveKey') 的返回值
 * @param callIndex 调用序号（从 0 开始）
 */
export function expectNonExtractableKeyDerivation(
  spy: ReturnType<typeof vi.spyOn>,
  callIndex: number
): void {
  const call = spy.mock.calls[callIndex];
  expect(call[3]).toBe(false);
}

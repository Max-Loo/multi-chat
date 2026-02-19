/**
 * Mock 相关自定义断言
 */

import { vi, expect } from 'vitest';

interface MatcherContext {
  isNot: boolean;
  promise: string;
}

/**
 * 断言 Mock 被调用过指定次数
 * @param mockFn Mock 函数
 * @param times 期望的调用次数
 */
export const verifyMockCalls = (mockFn: ReturnType<typeof vi.fn>, times: number): void => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};

/**
 * 断言 Mock 被调用时包含指定参数
 * @param mockFn Mock 函数
 * @param expectedArgs 期望的参数（部分匹配）
 */
export const verifyMockCalledWith = (
  mockFn: ReturnType<typeof vi.fn>,
  expectedArgs: Record<string, unknown>
): void => {
  const calls = mockFn.mock.calls;
  const found = calls.some((call) => {
    // 检查第一个参数是否包含期望的属性
    if (call[0] && typeof call[0] === 'object') {
      return Object.entries(expectedArgs).every(([key, value]) => call[0][key] === value);
    }
    return false;
  });

  if (!found) {
    throw new Error(
      `Mock was not called with expected args: ${JSON.stringify(expectedArgs)}\nActual calls: ${JSON.stringify(calls)}`
    );
  }
};

/**
 * 断言 Mock 被调用时包含指定的 service 参数
 */
export const toHaveBeenCalledWithService = function (
  this: MatcherContext,
  received: ReturnType<typeof vi.fn>,
  service: string
) {
  const { isNot } = this;
  const calls = received.mock.calls;
  const pass = calls.some((call) => call[0] === service);

  return {
    pass,
    message: () =>
      isNot
        ? `Expected mock not to be called with service "${service}"`
        : `Expected mock to be called with service "${service}", but it was called with: ${JSON.stringify(calls.map((c) => c[0]))}`,
  };
};

/**
 * 扩展 Vitest 的 expect
 */
export const extendExpectWithMock = () => {
  expect.extend({
    toHaveBeenCalledWithService,
  });
};

// 声明扩展的类型
declare module 'vitest' {
  interface Assertion {
    toHaveBeenCalledWithService(service: string): void;
  }
}

/**
 * Mock 相关自定义断言
 */

import { vi, expect } from 'vitest';

interface MatcherContext {
  isNot: boolean;
  promise: string;
}

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

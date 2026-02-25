/**
 * 加密相关自定义断言
 */

import { expect } from 'vitest';

interface MatcherContext {
  isNot: boolean;
  promise: string;
}

/**
 * 断言值是加密格式（以 enc: 开头）
 */
export const toBeEncrypted = function (this: MatcherContext, received: unknown) {
  const { isNot } = this;
  const pass = typeof received === 'string' && received.startsWith('enc:');

  return {
    pass,
    message: () =>
      isNot
        ? `Expected value not to be encrypted (start with 'enc:')`
        : `Expected value to be encrypted (start with 'enc:'), received: ${received}`,
  };
};

/**
 * 断言值是有效的主密钥格式（64个十六进制字符）
 */
export const toBeValidMasterKey = function (this: MatcherContext, received: unknown) {
  const { isNot } = this;
  const pass = typeof received === 'string' && /^[0-9a-f]{64}$/.test(received);

  return {
    pass,
    message: () =>
      isNot
        ? `Expected value not to be a valid master key`
        : `Expected value to be a valid master key (64 hex characters), received: ${received}`,
  };
};

/**
 * 扩展 Vitest 的 expect
 */
export const extendExpect = () => {
  expect.extend({
    toBeEncrypted,
    toBeValidMasterKey,
  });
};

// 声明扩展的类型
declare module 'vitest' {
  interface Assertion {
    toBeEncrypted(): void;
    toBeValidMasterKey(): void;
  }
}

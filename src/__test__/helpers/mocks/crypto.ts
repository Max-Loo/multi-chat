/**
 * 加密模块 Mock 工厂
 * 
 * 提供统一的加密相关 Mock 创建函数
 */

import { vi } from 'vitest';
import type { CryptoMocks } from './types';

/**
 * 创建加密模块 Mock
 * @returns 加密 Mock 对象
 */
export const createCryptoMocks = (): CryptoMocks => {
  // 默认实现：加密返回带前缀的字符串
  const encryptField = vi.fn().mockImplementation(async (plaintext: string) => {
    return `enc:${plaintext}`;
  });

  // 默认实现：解密返回去掉前缀的字符串
  const decryptField = vi.fn().mockImplementation(async (ciphertext: string) => {
    if (!ciphertext.startsWith('enc:')) {
      throw new Error('无效的加密数据格式：缺少 enc: 前缀');
    }
    return ciphertext.slice(4);
  });

  // 默认实现：判断是否加密
  const isEncrypted = vi.fn().mockImplementation((value: string) => {
    return value.startsWith('enc:');
  });

  const allMocks = [encryptField, decryptField, isEncrypted];

  return {
    encryptField,
    decryptField,
    isEncrypted,

    /**
     * 重置所有 Mock
     */
    resetAll: () => {
      allMocks.forEach((mock) => {
        mock.mockClear();
        mock.mockReset();
      });
      // 重新设置默认实现
      encryptField.mockImplementation(async (plaintext: string) => `enc:${plaintext}`);
      decryptField.mockImplementation(async (ciphertext: string) => {
        if (!ciphertext.startsWith('enc:')) {
          throw new Error('无效的加密数据格式：缺少 enc: 前缀');
        }
        return ciphertext.slice(4);
      });
      isEncrypted.mockImplementation((value: string) => value.startsWith('enc:'));
    },
  };
};

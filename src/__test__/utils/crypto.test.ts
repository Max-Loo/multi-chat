/**
 * Crypto 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import { encryptField, decryptField, isEncrypted } from '@/utils/crypto';

describe('Crypto 工具函数', () => {
  // 测试用的 256-bit 主密钥（hex 编码）
  const masterKey = 'a'.repeat(64); // 64 个 hex 字符 = 256 bits

  describe('encryptField', () => {
    it('应该成功加密明文', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptField(plaintext, masterKey);

      expect(encrypted).toMatch(/^enc:/);
      expect(encrypted.length).toBeGreaterThan(4); // 至少包含 "enc:" 前缀和加密数据
    });

    it('每次加密应该产生不同的密文（因为使用随机 nonce）', async () => {
      const plaintext = 'Same text';
      const encrypted1 = await encryptField(plaintext, masterKey);
      const encrypted2 = await encryptField(plaintext, masterKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('应该正确加密空字符串', async () => {
      const plaintext = '';
      const encrypted = await encryptField(plaintext, masterKey);

      expect(encrypted).toMatch(/^enc:/);
    });
  });

  describe('decryptField', () => {
    it('应该成功解密密文', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptField(plaintext, masterKey);
      const decrypted = await decryptField(encrypted, masterKey);

      expect(decrypted).toBe(plaintext);
    });

    it('应该正确解密空字符串', async () => {
      const plaintext = '';
      const encrypted = await encryptField(plaintext, masterKey);
      const decrypted = await decryptField(encrypted, masterKey);

      expect(decrypted).toBe(plaintext);
    });

    it('使用错误的密钥应该抛出错误', async () => {
      const plaintext = 'Hello, World!';
      const correctKey = masterKey;
      const wrongKey = 'b'.repeat(64);

      const encrypted = await encryptField(plaintext, correctKey);

      await expect(decryptField(encrypted, wrongKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    it('缺少 enc: 前缀应该抛出错误', async () => {
      const invalidCiphertext = 'invalid-format';

      await expect(decryptField(invalidCiphertext, masterKey)).rejects.toThrow(
        '无效的加密数据格式：缺少 enc: 前缀'
      );
    });
  });

  describe('isEncrypted', () => {
    it('应该正确识别加密字符串', () => {
      expect(isEncrypted('enc:SGVsbG8=')).toBe(true);
      expect(isEncrypted('enc:any-text-here')).toBe(true);
    });

    it('应该正确识别未加密字符串', () => {
      expect(isEncrypted('plain-text')).toBe(false);
      expect(isEncrypted('enc:'.substring(0, 3))).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });
  });

  describe('加密/解密往返', () => {
    it('应该保持数据的完整性', async () => {
      const testCases = [
        'Simple text',
        '中文测试',
        'Special characters: !@#$%^&*()',
        'Numbers: 1234567890',
        'Multi\nline\ntext',
        'Very long text'.repeat(100),
      ];

      for (const plaintext of testCases) {
        const encrypted = await encryptField(plaintext, masterKey);
        const decrypted = await decryptField(encrypted, masterKey);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});

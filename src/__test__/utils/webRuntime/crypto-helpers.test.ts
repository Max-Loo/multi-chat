/**
 * crypto-helpers 测试
 *
 * 测试 AES-256-GCM 加解密的正确性、IV 唯一性和错误处理
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '@/utils/tauriCompat/crypto-helpers';

describe('crypto-helpers', () => {
  let cryptoKey: CryptoKey;

  beforeAll(async () => {
    // 生成 AES-256-GCM 测试密钥
    cryptoKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  });

  describe('AES-256-GCM 加解密往返', () => {
    it('应该正确加密和解密基本文本', async () => {
      const plaintext = 'Hello, World!';
      const { ciphertext, iv } = await encrypt(plaintext, cryptoKey);
      const decrypted = await decrypt(ciphertext, iv, cryptoKey);

      expect(decrypted).toBe(plaintext);
    });

    it('应该正确处理空字符串', async () => {
      const plaintext = '';
      const { ciphertext, iv } = await encrypt(plaintext, cryptoKey);
      const decrypted = await decrypt(ciphertext, iv, cryptoKey);

      expect(decrypted).toBe('');
    });

    it('应该正确处理长文本', async () => {
      const plaintext = 'A'.repeat(2048);
      const { ciphertext, iv } = await encrypt(plaintext, cryptoKey);
      const decrypted = await decrypt(ciphertext, iv, cryptoKey);

      expect(decrypted).toBe(plaintext);
    });

    it('应该正确处理 Unicode 文本', async () => {
      const plaintext = '你好世界 🌍 café résumé 日本語';
      const { ciphertext, iv } = await encrypt(plaintext, cryptoKey);
      const decrypted = await decrypt(ciphertext, iv, cryptoKey);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('IV 唯一性', () => {
    it('应该在相同明文加密两次时产生不同的 IV 和密文', async () => {
      const plaintext = 'same text';

      const result1 = await encrypt(plaintext, cryptoKey);
      const result2 = await encrypt(plaintext, cryptoKey);

      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
    });
  });

  describe('错误处理', () => {
    it('应该在用错误密钥解密时抛出错误', async () => {
      const wrongKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const { ciphertext, iv } = await encrypt('secret data', cryptoKey);

      await expect(decrypt(ciphertext, iv, wrongKey)).rejects.toThrow();
    });

    it('应该在用损坏的密文解密时抛出错误', async () => {
      const { iv } = await encrypt('secret data', cryptoKey);
      const corruptedCiphertext = 'aW52YWxpZGJhc2U2NA=='; // 无效的 base64

      await expect(decrypt(corruptedCiphertext, iv, cryptoKey)).rejects.toThrow();
    });

    it('应该返回包含 ciphertext 和 iv 的正确结构', async () => {
      const result = await encrypt('test', cryptoKey);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(typeof result.ciphertext).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(result.ciphertext.length).toBeGreaterThan(0);
      expect(result.iv.length).toBeGreaterThan(0);
    });
  });
});

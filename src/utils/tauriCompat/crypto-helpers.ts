/**
 * 加密辅助函数公共模块
 * 提供 AES-256-GCM 加解密函数和密码记录类型
 */

import { bytesToBase64, base64ToBytes } from '@/utils/crypto';

/**
 * 密码记录结构（存储在 IndexedDB 中）
 */
export interface PasswordRecord {
  service: string;
  user: string;
  encryptedPassword: string;
  iv: string;
  createdAt: number;
}

/**
 * 使用 AES-256-GCM 加密数据
 * @param {string} plaintext - 明文
 * @param {CryptoKey} key - 加密密钥
 * @returns {Promise<{ ciphertext: string; iv: string }>} 加密后的密文和 IV（base64 编码）
 */
export const encrypt = async (plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // 生成随机 IV（12 字节是 GCM 推荐长度）
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
};

/**
 * 使用 AES-256-GCM 解密数据
 * @param {string} ciphertext - base64 编码的密文
 * @param {string} iv - base64 编码的 IV
 * @param {CryptoKey} key - 解密密钥
 * @returns {Promise<string>} 解密后的明文
 */
export const decrypt = async (ciphertext: string, iv: string, key: CryptoKey): Promise<string> => {
  const encryptedData = base64ToBytes(ciphertext);
  const ivData = base64ToBytes(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData as Uint8Array<ArrayBuffer> },
    key,
    encryptedData as Uint8Array<ArrayBuffer>
  );
  const decoder = new TextDecoder();

  return decoder.decode(decrypted);
};

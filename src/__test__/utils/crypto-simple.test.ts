/**
 * 简单的 crypto 集成测试
 */

import 'fake-indexeddb/auto';
import { test, expect, beforeEach } from 'vitest';
import { encryptField, decryptField } from '@/utils/crypto';
import { initializeMasterKey } from '@/store/keyring/masterKey';

beforeEach(async () => {
  // 清理 IndexedDB
  await new Promise<void>((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase('multi-chat-keyring');
    deleteReq.addEventListener('success', () => resolve());
    deleteReq.addEventListener('error', () => reject(deleteReq.error));
  });
  
  // 清理 localStorage
  localStorage.clear();
});

test('simple integration test', async () => {
  // 初始化密钥
  const { key: masterKey } = await initializeMasterKey();
  expect(masterKey).toHaveLength(64);
  
  // 加密和解密
  const plaintext = 'Hello, World!';
  const ciphertext = await encryptField(plaintext, masterKey);
  const decrypted = await decryptField(ciphertext, masterKey);
  
  expect(decrypted).toBe(plaintext);
});

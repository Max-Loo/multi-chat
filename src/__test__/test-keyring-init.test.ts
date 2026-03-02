import { test, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { setPassword, getPassword } from '@/utils/tauriCompat/keyring';

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

test('WebKeyringCompat init and set/get password', async () => {
  // 设置密码
  await setPassword('test-service', 'test-user', 'test-password');
  
  // 获取密码
  const password = await getPassword('test-service', 'test-user');
  
  expect(password).toBe('test-password');
});

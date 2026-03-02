import { test, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
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

test('initializeMasterKey works', async () => {
  const key = await initializeMasterKey();
  
  expect(key).toBeDefined();
  expect(key).toHaveLength(64);
});

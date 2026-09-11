import 'fake-indexeddb/auto';
import { it, expect, beforeEach, vi } from 'vitest';
import { initializeMasterKey } from '@/store/keyring/masterKey';

// Mock @/utils/platform/env 模块（隔离加密派生迭代次数等环境因素）
vi.mock('@/utils/platform/env', () => ({
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256',
  DERIVED_KEY_LENGTH: 256,
}));

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

it('mock 环境下 initializeMasterKey 正常工作', async () => {
  const { key } = await initializeMasterKey();
  expect(key).toHaveLength(64);
});

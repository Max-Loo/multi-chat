import 'fake-indexeddb/auto';
import { it, expect, beforeEach, vi } from 'vitest';
import { initializeMasterKey } from '@/store/keyring/masterKey';

// Mock @/utils/platform/env 模块（隔离测试环境检测的真实实现）
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

it('env mock 下 initializeMasterKey 正常生成主密钥', async () => {
  const { key } = await initializeMasterKey();
  expect(key).toHaveLength(64);
});

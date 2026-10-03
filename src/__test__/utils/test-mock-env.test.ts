import 'fake-indexeddb/auto';
import { it, expect, beforeEach, vi } from 'vitest';
import { initializeMasterKey } from '@/store/keyring/masterKey';

// Mock @/utils/webStorage/env 模块（测试环境参数加速）
vi.mock('@/utils/webStorage/env', () => ({
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256',
  DERIVED_KEY_LENGTH: 256,
}));

import { getPBKDF2Iterations } from '@/utils/webStorage/env';
const mockGetPBKDF2Iterations = vi.mocked(getPBKDF2Iterations);

beforeEach(async () => {
  // 清理 IndexedDB
  await new Promise<void>((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase('multi-chat-keyring');
    deleteReq.addEventListener('success', () => resolve());
    deleteReq.addEventListener('error', () => reject(deleteReq.error));
  });

  // 清理 localStorage
  localStorage.clear();

  // 设置低迭代次数
  mockGetPBKDF2Iterations.mockReturnValue(1000);
});

it('mock webStorage/env works', async () => {
  expect(mockGetPBKDF2Iterations()).toBe(1000);

  const { key } = await initializeMasterKey();
  expect(key).toHaveLength(64);
});

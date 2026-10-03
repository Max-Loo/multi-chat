import 'fake-indexeddb/auto';
import { it, expect, beforeEach, vi } from 'vitest';
import { initializeMasterKey } from '@/store/keyring/masterKey';

// Mock @/utils/platform/env 模块中的 isTauri 函数
vi.mock('@/utils/platform/env', () => ({
  isTauri: vi.fn(),
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256',
  DERIVED_KEY_LENGTH: 256,
}));

import { isTauri } from '@/utils/platform/env';
const mockIsTauri = vi.mocked(isTauri);

beforeEach(async () => {
  // 清理 IndexedDB
  await new Promise<void>((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase('multi-chat-keyring');
    deleteReq.addEventListener('success', () => resolve());
    deleteReq.addEventListener('error', () => reject(deleteReq.error));
  });
  
  // 清理 localStorage
  localStorage.clear();

  // 设置默认为 Web 环境
  mockIsTauri.mockReturnValue(false);
});

it('mock isTauri works', async () => {
  expect(mockIsTauri()).toBe(false);
  
  const { key } = await initializeMasterKey();
  expect(key).toHaveLength(64);
});

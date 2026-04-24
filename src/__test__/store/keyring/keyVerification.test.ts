/**
 * keyVerification 单元测试
 *
 * 验证密钥验证逻辑：匹配、不匹配、无加密数据三种场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyMasterKey, resetVerificationStore } from '@/store/keyring/keyVerification';

// Mock crypto 模块
vi.mock('@/utils/crypto', () => ({
  decryptField: vi.fn(),
  isEncrypted: vi.fn((value: string) => value.startsWith('enc:')),
}));

import { loadFromStore } from '@/store/storage/storeUtils';
import { decryptField } from '@/utils/crypto';

/** 创建 mock 模型数据 */
const createMockModels = (apiKey: string | undefined) => [
  { id: '1', nickname: 'test', apiKey, providerKey: 'test', model: 'test' },
];

describe('verifyMasterKey', () => {
  const testKey = 'a'.repeat(64);

  beforeEach(() => {
    vi.clearAllMocks();
    resetVerificationStore();
  });

  it('应该返回 true 当密钥能解密加密数据', async () => {
    vi.mocked(loadFromStore).mockResolvedValue(createMockModels('enc:someEncryptedValue') as any);
    vi.mocked(decryptField).mockResolvedValue('decrypted-api-key');

    const result = await verifyMasterKey(testKey);

    expect(result).toBe(true);
    expect(decryptField).toHaveBeenCalledWith('enc:someEncryptedValue', testKey);
  });

  it('应该返回 false 当密钥无法解密加密数据', async () => {
    vi.mocked(loadFromStore).mockResolvedValue(createMockModels('enc:someEncryptedValue') as any);
    vi.mocked(decryptField).mockRejectedValue(new Error('解密失败'));

    const result = await verifyMasterKey(testKey);

    expect(result).toBe(false);
  });

  it('应该返回 null 当没有加密数据', async () => {
    vi.mocked(loadFromStore).mockResolvedValue(createMockModels('plain-text-key') as any);

    const result = await verifyMasterKey(testKey);

    expect(result).toBeNull();
    expect(decryptField).not.toHaveBeenCalled();
  });

  it('应该返回 null 当 Store 为空', async () => {
    vi.mocked(loadFromStore).mockResolvedValue([]);

    const result = await verifyMasterKey(testKey);

    expect(result).toBeNull();
  });

  it('应该返回 null 当模型没有 apiKey 字段', async () => {
    vi.mocked(loadFromStore).mockResolvedValue(createMockModels(undefined) as any);

    const result = await verifyMasterKey(testKey);

    expect(result).toBeNull();
  });

  it('应该找到第一个加密的 apiKey 并验证', async () => {
    const models = [
      { id: '1', nickname: 'test1', apiKey: 'plain-key', providerKey: 'test', model: 'test' },
      { id: '2', nickname: 'test2', apiKey: 'enc:encryptedValue', providerKey: 'test', model: 'test' },
    ];
    vi.mocked(loadFromStore).mockResolvedValue(models as any);
    vi.mocked(decryptField).mockResolvedValue('decrypted');

    const result = await verifyMasterKey(testKey);

    expect(result).toBe(true);
    expect(decryptField).toHaveBeenCalledWith('enc:encryptedValue', testKey);
    expect(decryptField).toHaveBeenCalledTimes(1);
  });
});

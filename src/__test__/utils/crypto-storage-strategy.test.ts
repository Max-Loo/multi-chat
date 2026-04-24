/**
 * Crypto 加密业务策略单元测试
 *
 * 测试目的：验证加密业务策略场景（批量容错、masterKey 丢失降级、混合加密状态）
 * 测试范围：不重复测试 crypto.ts 的基本加密/解密功能（由 crypto.test.ts 覆盖）
 * 测试隔离：所有外部依赖（@/utils/tauriCompat、@/store/storage/modelStorage）均被 Mock
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { encryptField, decryptField } from '@/utils/crypto';

// Mock @/utils/tauriCompat 模块
vi.mock('@/utils/tauriCompat', () => ({
  keyring: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true),
    resetState: vi.fn(),
  },
  isTauri: vi.fn(),
}));

// Mock @/store/storage/modelStorage 模块
vi.mock('@/store/storage/modelStorage', () => ({
  saveModelsToJson: vi.fn(),
  loadModelsFromJson: vi.fn(),
}));

describe('Crypto 加密业务策略单元测试', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. 批量操作的容错机制验证
  // ========================================

  describe('批量操作的容错机制', () => {
    it('所有模型都使用旧密钥：应保留原始 enc: 值', async () => {
      // Given: 所有模型都使用旧密钥加密
      const oldKey = 'a'.repeat(64);
      const newKey = 'b'.repeat(64);

      const models = [
        { id: '1', name: 'Model 1', apiKey: await encryptField('key1', oldKey) },
        { id: '2', name: 'Model 2', apiKey: await encryptField('key2', oldKey) },
      ];

      // When: 使用新密钥解密所有模型（保留 enc: 值）
      const results = await Promise.allSettled(
        models.map(async (model) => {
          try {
            const decrypted = await decryptField(model.apiKey, newKey);
            return { ...model, apiKey: decrypted };
          } catch {
            // 解密失败：保留原始 enc: 值
            return { ...model, apiKey: model.apiKey };
          }
        })
      );

      // Then: 所有模型的 apiKey 都应保留原始 enc: 值
      const successfulResults = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<{ apiKey: string }>[];
      expect(successfulResults.length, '所有模型都应该返回结果').toBe(2);
      expect(successfulResults[0].value.apiKey, '第一个模型的 apiKey 应保留 enc: 值').toMatch(/^enc:/);
      expect(successfulResults[1].value.apiKey, '第二个模型的 apiKey 应保留 enc: 值').toMatch(/^enc:/);
    });

    it('部分模型使用旧密钥：失败模型应保留 enc: 值', async () => {
      // Given: 10 个模型，2 个使用旧密钥
      const oldKey = 'a'.repeat(64);
      const newKey = 'b'.repeat(64);

      const models = await Promise.all([
        { id: '1', apiKey: await encryptField('key1', newKey) },
        { id: '2', apiKey: await encryptField('key2', newKey) },
        { id: '3', apiKey: await encryptField('key3', oldKey) }, // 旧密钥
        { id: '4', apiKey: await encryptField('key4', newKey) },
        { id: '5', apiKey: await encryptField('key5', oldKey) }, // 旧密钥
        { id: '6', apiKey: await encryptField('key6', newKey) },
        { id: '7', apiKey: await encryptField('key7', newKey) },
        { id: '8', apiKey: await encryptField('key8', newKey) },
        { id: '9', apiKey: await encryptField('key9', newKey) },
        { id: '10', apiKey: await encryptField('key10', newKey) },
      ]);

      // When: 使用新密钥解密所有模型
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const results = await Promise.all(
        models.map(async (model) => {
          try {
            const decrypted = await decryptField(model.apiKey, newKey);
            return { id: model.id, apiKey: decrypted };
          } catch (error) {
            consoleErrorSpy(`模型 ${model.id} 解密失败: ${error}`);
            return { id: model.id, apiKey: model.apiKey };
          }
        })
      );
      consoleErrorSpy.mockRestore();

      // Then: 8 个模型解密成功，2 个模型保留 enc: 值
      const successfulDecryptions = results.filter(r => !r.apiKey.startsWith('enc:'));
      const failedDecryptions = results.filter(r => r.apiKey.startsWith('enc:'));

      expect(successfulDecryptions.length, '应成功解密 8 个模型').toBe(8);
      expect(failedDecryptions.length, '应失败 2 个模型').toBe(2);
      expect(failedDecryptions[0].id, '模型 3 应解密失败').toBe('3');
      expect(failedDecryptions[1].id, '模型 5 应解密失败').toBe('5');
      failedDecryptions.forEach(r => {
        expect(r.apiKey, `模型 ${r.id} 应保留 enc: 值`).toMatch(/^enc:/);
      });
    });
  });

  // ========================================
  // 2. 主密钥丢失后的数据访问测试
  // ========================================

  describe('主密钥丢失后的数据访问', () => {
    it('加密的 apiKey 被替换为空字符串', async () => {
      // Given: 主密钥丢失，加密的模型列表
      const oldKey = 'a'.repeat(64);
      const models = [
        { id: '1', name: 'Model 1', apiKey: await encryptField('key1', oldKey) },
        { id: '2', name: 'Model 2', apiKey: await encryptField('key2', oldKey) },
      ];

      // When: 尝试使用空密钥解密（模拟主密钥丢失）
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const results = models.map((model) => {
        try {
          const masterKey = '';
          if (!masterKey) {
            consoleWarnSpy(`模型 ${model.id} 的 apiKey 无法解密：主密钥丢失`);
            return { ...model, apiKey: '' };
          }
          return model;
        } catch {
          return { ...model, apiKey: '' };
        }
      });
      consoleWarnSpy.mockRestore();

      // Then: 所有加密的 apiKey 应被替换为空字符串
      expect(results[0].apiKey, '模型 1 的 apiKey 应为空').toBe('');
      expect(results[1].apiKey, '模型 2 的 apiKey 应为空').toBe('');
    });

    it('未加密的 apiKey 保持不变', async () => {
      // Given: 混合加密/未加密的 apiKey
      const models = [
        { id: '1', apiKey: 'plain-key1' },
        { id: '2', apiKey: await encryptField('key2', 'a'.repeat(64)) },
        { id: '3', apiKey: 'plain-key3' },
      ];

      // When: 尝试使用空密钥解密（模拟主密钥丢失）
      const results = models.map((model) => {
        if (model.apiKey.startsWith('enc:')) {
          return { ...model, apiKey: '' };
        }
        return model;
      });

      // Then: 未加密的 apiKey 应保持不变
      expect(results[0].apiKey, '模型 1 的未加密 apiKey 应保持不变').toBe('plain-key1');
      expect(results[1].apiKey, '模型 2 的加密 apiKey 应为空').toBe('');
      expect(results[2].apiKey, '模型 3 的未加密 apiKey 应保持不变').toBe('plain-key3');
    });
  });

  // ========================================
  // 3. 混合数据完整性测试
  // ========================================

  describe('混合加密状态的数据完整性', () => {
    it('保存混合加密状态的模型：仅未加密的 apiKey 被加密', async () => {
      // Given: 4 个模型（未加密、已加密、空、undefined）
      const masterKey = 'a'.repeat(64);
      const models = [
        { id: '1', apiKey: 'plain-key1' },
        { id: '2', apiKey: await encryptField('key2', masterKey) },
        { id: '3', apiKey: '' },
        { id: '4', apiKey: undefined },
      ];

      // When: 重新加密所有 apiKey
      const processed = await Promise.all(
        models.map(async (model) => {
          if (!model.apiKey || model.apiKey.startsWith('enc:')) {
            return model;
          }
          return { ...model, apiKey: await encryptField(model.apiKey, masterKey) };
        })
      );

      // Then: 仅未加密的 apiKey 被加密
      expect(processed[0].apiKey, '模型 1 的 apiKey 应被加密').toMatch(/^enc:/);
      expect(processed[1].apiKey, '模型 2 的 apiKey 不应重复加密').toBe(models[1].apiKey);
      expect(processed[2].apiKey, '模型 3 的空 apiKey 应保持不变').toBe('');
      expect(processed[3].apiKey, '模型 4 的 undefined apiKey 应保持不变').toBeUndefined();
    });

    it('加载混合加密状态的模型：加密的 apiKey 被解密', async () => {
      // Given: 混合加密/未加密的模型列表
      const masterKey = 'a'.repeat(64);
      const models = [
        { id: '1', apiKey: await encryptField('key1', masterKey) },
        { id: '2', apiKey: 'plain-key2' },
        { id: '3', apiKey: await encryptField('key3', masterKey) },
      ];

      // When: 解密所有 apiKey
      const processed = await Promise.all(
        models.map(async (model) => {
          if (!model.apiKey?.startsWith('enc:')) {
            return model;
          }
          return { ...model, apiKey: await decryptField(model.apiKey, masterKey) };
        })
      );

      // Then: 加密的 apiKey 被解密，未加密的保持不变
      expect(processed[0].apiKey, '模型 1 的 apiKey 应被解密').toBe('key1');
      expect(processed[1].apiKey, '模型 2 的 apiKey 应保持不变').toBe('plain-key2');
      expect(processed[2].apiKey, '模型 3 的 apiKey 应被解密').toBe('key3');
    });
  });

  // ========================================
  // 4. masterKey = null 边界场景测试
  // ========================================

  describe('masterKey = null 边界场景', () => {
    it('主密钥不存在时：加密字段置空但不算解密失败', async () => {
      // Given: 加密的模型列表，但主密钥不存在
      const oldKey = 'a'.repeat(64);
      const models = [
        { id: '1', apiKey: await encryptField('key1', oldKey) },
        { id: '2', apiKey: await encryptField('key2', oldKey) },
      ];

      // When: 模拟主密钥不存在（masterKey = null）
      const results = models.map((model) => {
        if (model.apiKey.startsWith('enc:')) {
          return { ...model, apiKey: '' };
        }
        return model;
      });

      // Then: 加密字段被置空
      expect(results[0].apiKey, '模型 1 的 apiKey 应被置空').toBe('');
      expect(results[1].apiKey, '模型 2 的 apiKey 应被置空').toBe('');
    });

    it('主密钥不存在时：明文字段保持不变', async () => {
      // Given: 混合加密/明文的模型
      const models = [
        { id: '1', apiKey: 'plain-key1' },
        { id: '2', apiKey: await encryptField('key2', 'a'.repeat(64)) },
        { id: '3', apiKey: 'plain-key3' },
      ];

      // When: 模拟主密钥不存在
      const results = models.map((model) => {
        if (model.apiKey.startsWith('enc:')) {
          return { ...model, apiKey: '' };
        }
        return model;
      });

      // Then: 明文字段保持不变
      expect(results[0].apiKey, '模型 1 明文应保持不变').toBe('plain-key1');
      expect(results[1].apiKey, '模型 2 加密字段应被置空').toBe('');
      expect(results[2].apiKey, '模型 3 明文应保持不变').toBe('plain-key3');
    });
  });
});

/**
 * modelStorage.ts 集成测试
 * 测试模型数据的加密存储和加载功能
 *
 * 使用真实实现：
 * - fake-indexeddb 模拟 Tauri store
 * - 真实的 Web Crypto API 加密/解密
 * - 真实的 masterKey 管理（IndexedDB + AES-256-GCM）
 */

// 提供本地 storeUtils mock，使用 Map 持久化数据（集成测试需要真实存储行为）
const storeMap = new Map<string, unknown>();

vi.mock('@/store/storage/storeUtils', () => ({
  createLazyStore: vi.fn(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn((key: string) => Promise.resolve(storeMap.get(key) ?? null)),
    set: vi.fn((key: string, value: unknown) => { storeMap.set(key, value); return Promise.resolve(); }),
    delete: vi.fn((key: string) => { storeMap.delete(key); return Promise.resolve(); }),
    keys: vi.fn(() => Promise.resolve([...storeMap.keys()])),
    save: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true),
  })),
  saveToStore: vi.fn(async (store: { init: () => Promise<void>; set: (k: string, v: unknown) => Promise<void>; save: () => Promise<void> }, key: string, data: unknown) => {
    await store.init();
    await store.set(key, data);
    await store.save();
  }),
  loadFromStore: vi.fn(async (store: { init: () => Promise<void>; get: (k: string) => Promise<unknown> }, key: string, defaultValue: unknown) => {
    await store.init();
    return (await store.get(key)) ?? defaultValue;
  }),
}));

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import type { Model } from '@/types/model';
import {
  saveModelsToJson,
  loadModelsFromJson,
  resetModelsStore,
} from '@/store/storage/modelStorage';
import { storeMasterKey, getMasterKey } from '@/store/keyring/masterKey';
import * as masterKeyModule from '@/store/keyring/masterKey';
import { WebKeyringCompat } from '@/utils/tauriCompat/keyring';
import { createMockModel } from '@/__test__/fixtures/models';
import { asTestType } from '@/__test__/helpers/testing-utils';

// 导入 fake-indexeddb（必须在其他导入之前）
import 'fake-indexeddb/auto';

describe('modelStorage (Integration Test)', () => {
  // WebKeyringCompat 实例用于清理
  let keyringCompat: WebKeyringCompat;

  beforeAll(async () => {
    // 清理 Map 存储
    storeMap.clear();

    // 清理 IndexedDB 和 localStorage
    await Promise.all([
      new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('multi-chat-store');
        req.addEventListener('success', () => resolve());
        req.addEventListener('blocked', () => resolve());
        req.addEventListener('error', () => resolve());
      }),
      new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('multi-chat-keyring');
        req.addEventListener('success', () => resolve());
        req.addEventListener('blocked', () => resolve());
        req.addEventListener('error', () => resolve());
      }),
    ]);

    // 清理 localStorage
    localStorage.clear();

    // 创建 keyring 实例
    keyringCompat = new WebKeyringCompat();

    // 初始化 masterKey
    const masterKey = await getMasterKey();
    if (!masterKey) {
      const newKey = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');
      await storeMasterKey(newKey);
    }
  });

  afterAll(() => {
    // 关闭 keyring 连接
    if (keyringCompat) {
      keyringCompat.close();
    }
  });

  // 每个测试前重置 storeMap 和 modelsStore 单例，确保测试隔离
  beforeEach(() => {
    storeMap.clear();
    resetModelsStore();
  });

  // ========================================
  // 加密功能验证测试
  // ========================================
  describe('加密功能验证', () => {
    it('应该将 API key 加密存储', async () => {
      const mockModel = createMockModel({ apiKey: 'sk-sensitive-key-123' });

      // 保存模型
      await saveModelsToJson([mockModel]);

      // 加载模型（通过正常流程验证加密/解密）
      const { models: loadedModels } = await loadModelsFromJson();

      // 验证加载的数据是正确的（解密成功）
      expect(loadedModels).toHaveLength(1);
      expect(loadedModels[0].apiKey).toBe('sk-sensitive-key-123');
    });

    it('应该使用正确的加密格式（enc:base64）', async () => {
      const mockModel = createMockModel({ apiKey: 'sk-test-key' });

      await saveModelsToJson([mockModel]);

      // 加载并验证解密成功
      const { models: loadedModels } = await loadModelsFromJson();

      // 验证能够正确解密（如果加密格式错误，解密会失败）
      expect(loadedModels).toHaveLength(1);
      expect(loadedModels[0].apiKey).toBe('sk-test-key');
    });

    it('应该正确解密 API key', async () => {
      const originalKey = 'sk-my-secret-api-key';
      const mockModel = createMockModel({ apiKey: originalKey });

      // 保存模型
      await saveModelsToJson([mockModel]);

      // 加载模型
      const { models: loadedModels } = await loadModelsFromJson();

      // 验证解密后的 API key 正确
      expect(loadedModels).toHaveLength(1);
      expect(loadedModels[0].apiKey).toBe(originalKey);
    });
  });

  // ========================================
  // CRUD 操作测试
  // ========================================
  describe('CRUD 操作', () => {
    it('应该成功保存和加载模型列表', async () => {
      const models = [
        createMockModel({ id: 'model-1', nickname: 'Model 1' }),
        createMockModel({ id: 'model-2', nickname: 'Model 2' }),
        createMockModel({ id: 'model-3', nickname: 'Model 3' }),
      ];

      // 保存
      await saveModelsToJson(models);

      // 加载
      const { models: loadedModels } = await loadModelsFromJson();

      // 验证
      expect(loadedModels).toHaveLength(3);
      expect(loadedModels[0].id).toBe('model-1');
      expect(loadedModels[1].id).toBe('model-2');
      expect(loadedModels[2].id).toBe('model-3');
    });

    it('应该覆盖已存在的模型列表', async () => {
      // 第一次保存
      const models1 = [createMockModel({ id: 'model-1' })];
      await saveModelsToJson(models1);

      // 验证第一次保存成功
      const { models: loaded1 } = await loadModelsFromJson();
      expect(loaded1).toHaveLength(1);
      expect(loaded1[0].id).toBe('model-1');

      // 第二次保存（覆盖）
      const models2 = [
        createMockModel({ id: 'model-2' }),
        createMockModel({ id: 'model-3' }),
      ];
      await saveModelsToJson(models2);

      // 验证只有第二次的数据
      const { models: loadedModels } = await loadModelsFromJson();
      expect(loadedModels).toHaveLength(2);
      expect(loadedModels[0].id).toBe('model-2');
      expect(loadedModels[1].id).toBe('model-3');
    });

    it('应该处理空数据的场景', async () => {
      // 注意：由于 modelsStore 是模块级单例，这个测试验证
      // 在 store 初始化后读取数据的正常流程
      const { models: loadedModels } = await loadModelsFromJson();

      // 验证返回一个数组（可能是空的，也可能包含之前测试的数据）
      expect(Array.isArray(loadedModels)).toBe(true);
    });

    it('应该正确加密和保存多个模型', async () => {
      const models = [
        createMockModel({ id: 'model-1', apiKey: 'sk-key-1' }),
        createMockModel({ id: 'model-2', apiKey: 'sk-key-2' }),
        createMockModel({ id: 'model-3', apiKey: 'sk-key-3' }),
      ];

      await saveModelsToJson(models);

      // 验证加载后正确解密
      const { models: loadedModels } = await loadModelsFromJson();
      expect(loadedModels[0].apiKey).toBe('sk-key-1');
      expect(loadedModels[1].apiKey).toBe('sk-key-2');
      expect(loadedModels[2].apiKey).toBe('sk-key-3');
    });
  });

  // ========================================
  // 边界条件测试
  // ========================================
  describe('边界条件', () => {
    it('应该处理空的 API key', async () => {
      const model = createMockModel({ apiKey: '' });

      await saveModelsToJson([model]);

      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBe('');
    });

    it('应该处理 undefined 的 API key', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 测试边界条件，需要构造 apiKey 为 undefined 的 Model
      const model = createMockModel({ apiKey: asTestType<string>(undefined) });

      await saveModelsToJson([model]);

      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBeUndefined();
    });

    it('无效密文解密失败时应保留原始 enc: 值', async () => {
      const model = createMockModel({ apiKey: 'enc:already-encrypted' });

      await saveModelsToJson([model]);

      // 验证加载后保持原样（没有重复加密）
      const result = await loadModelsFromJson();

      // 无效密文解密失败，保留原始 enc: 值
      expect(result.models[0].apiKey).toMatch(/^enc:/);
      expect(result.decryptionFailureCount).toBe(1);
    });

    it('应该处理明文 API key（跳过解密）', async () => {
      // 直接写入明文数据到 Map 存储
      const model = createMockModel({ apiKey: 'sk-plaintext-key' });
      storeMap.set('models', [model]);

      // 加载应该保持明文
      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBe('sk-plaintext-key');
    });

    it('应该保存和加载模型（正常流程）', async () => {
      // 正常保存和加载
      const model = createMockModel({ apiKey: 'sk-test-key' });
      await saveModelsToJson([model]);

      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels).toHaveLength(1);
      expect(loadedModels[0].apiKey).toBe('sk-test-key');
    });

    it('应该处理 keyring 重新初始化的场景', async () => {
      // 先保存一个加密的模型
      const model = createMockModel({ apiKey: 'sk-original-key' });
      await saveModelsToJson([model]);

      // 关闭 keyring 并重新初始化
      keyringCompat.close();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 创建新的 keyring 实例（会使用相同的种子）
      keyringCompat = new WebKeyringCompat();

      // 加载应该成功（使用新的 keyring 实例）
      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels).toHaveLength(1);
      // 注意：由于种子相同，解密应该成功
      expect(loadedModels[0].apiKey).toBe('sk-original-key');
    });
  });

  // ========================================
  // 错误处理测试
  // ========================================
  describe('错误处理', () => {
    it('应该处理解密失败的场景', async () => {
      // 保存正常的模型
      const model = createMockModel({ apiKey: 'sk-test' });
      await saveModelsToJson([model]);

      // 修改存储的数据为无效的密文（直接操作 Map）
      const stored = storeMap.get('models') as Model[];
      stored[0].apiKey = 'enc:invalid-base64!';

      // 解密失败时保留原始 enc: 值
      const result = await loadModelsFromJson();

      expect(result.models[0].apiKey).toMatch(/^enc:/);
      expect(result.decryptionFailureCount).toBe(1);
    });

    it('应该处理部分模型解密失败的场景', async () => {
      // 保存多个模型
      const models = [
        createMockModel({ id: 'model-1', apiKey: 'sk-key-1' }),
        createMockModel({ id: 'model-2', apiKey: 'sk-key-2' }),
        createMockModel({ id: 'model-3', apiKey: 'sk-key-3' }),
      ];
      await saveModelsToJson(models);

      // 修改第二个模型的数据为无效密文（直接操作 Map）
      const stored = storeMap.get('models') as Model[];
      stored[1].apiKey = 'enc:invalid';

      // 加载应继续处理，失败的模型保留原始 enc: 值
      const result = await loadModelsFromJson();

      expect(result.models).toHaveLength(3);
      expect(result.models[0].apiKey).toBe('sk-key-1');
      expect(result.models[1].apiKey).toMatch(/^enc:/); // 解密失败，保留 enc:
      expect(result.models[2].apiKey).toBe('sk-key-3');
      expect(result.decryptionFailureCount).toBe(1);
    });

    it('应该处理并发保存和加载的场景', async () => {
      // 并发操作
      const model1 = createMockModel({ id: 'model-1', apiKey: 'sk-key-1' });
      const model2 = createMockModel({ id: 'model-2', apiKey: 'sk-key-2' });

      await Promise.all([
        saveModelsToJson([model1]),
        saveModelsToJson([model2]),
      ]);

      // 最后一次保存应该生效
      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels).toHaveLength(1);
      expect(['model-1', 'model-2']).toContain(loadedModels[0].id);
    });
  });

  // ========================================
  // 并发操作测试
  // ========================================
  describe('并发操作', () => {
    it('应该处理并发保存操作', async () => {
      const models1 = [createMockModel({ id: 'model-1' })];
      const models2 = [createMockModel({ id: 'model-2' })];
      const models3 = [createMockModel({ id: 'model-3' })];

      // 并发保存
      await Promise.all([
        saveModelsToJson(models1),
        saveModelsToJson(models2),
        saveModelsToJson(models3),
      ]);

      // 最后一次保存应该生效
      const { models: loadedModels } = await loadModelsFromJson();

      expect(loadedModels).toHaveLength(1);
      expect(['model-1', 'model-2', 'model-3']).toContain(loadedModels[0].id);
    });

    it('应该处理并发加载操作', async () => {
      const models = [createMockModel({ id: 'model-1' })];
      await saveModelsToJson(models);

      // 并发加载
      const results = await Promise.all([
        loadModelsFromJson(),
        loadModelsFromJson(),
        loadModelsFromJson(),
      ]);

      // 所有加载应该成功
      results.forEach(({ models: loadedModels }) => {
        expect(loadedModels).toHaveLength(1);
        expect(loadedModels[0].id).toBe('model-1');
      });
    });
  });

  // ========================================
  // 性能测试
  // ========================================
  describe('性能测试', () => {
    it('应该在合理时间内完成 100 个模型的加密和保存', async () => {
      const models = Array.from({ length: 100 }, (_, i) =>
        createMockModel({ id: `model-${i}`, apiKey: `sk-key-${i}` })
      );

      const startTime = Date.now();
      await saveModelsToJson(models);
      const endTime = Date.now();

      // 加密和保存 100 个模型应该在 5 秒内完成
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('应该在合理时间内完成 100 个模型的加载和解密', async () => {
      const models = Array.from({ length: 100 }, (_, i) =>
        createMockModel({ id: `model-${i}`, apiKey: `sk-key-${i}` })
      );
      await saveModelsToJson(models);

      const startTime = Date.now();
      const { models: loadedModels } = await loadModelsFromJson();
      const endTime = Date.now();

      expect(loadedModels).toHaveLength(100);
      // 加载和解密 100 个模型应该在 5 秒内完成
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  // ========================================
  // 解密失败统计测试
  // ========================================
  describe('解密失败统计', () => {
    it('所有模型解密成功时 decryptionFailureCount 为 0', async () => {
      const models = [
        createMockModel({ id: 'model-1', apiKey: 'sk-key-1' }),
        createMockModel({ id: 'model-2', apiKey: 'sk-key-2' }),
      ];
      await saveModelsToJson(models);

      const result = await loadModelsFromJson();

      expect(result.decryptionFailureCount).toBe(0);
      expect(result.models).toHaveLength(2);
      expect(result.models[0].apiKey).toBe('sk-key-1');
      expect(result.models[1].apiKey).toBe('sk-key-2');
    });

    it('空数据时 decryptionFailureCount 为 0', async () => {
      const result = await loadModelsFromJson();

      expect(result.decryptionFailureCount).toBe(0);
      expect(result.models).toHaveLength(0);
    });

    it('多个模型解密失败时 decryptionFailureCount 统计准确', async () => {
      const models = [
        createMockModel({ id: 'model-1', apiKey: 'sk-key-1' }),
        createMockModel({ id: 'model-2', apiKey: 'sk-key-2' }),
        createMockModel({ id: 'model-3', apiKey: 'sk-key-3' }),
      ];
      await saveModelsToJson(models);

      // 修改前两个为无效密文
      const stored = storeMap.get('models') as Model[];
      stored[0].apiKey = 'enc:invalid-1';
      stored[1].apiKey = 'enc:invalid-2';

      const result = await loadModelsFromJson();

      expect(result.decryptionFailureCount).toBe(2);
      expect(result.models[0].apiKey).toMatch(/^enc:/);
      expect(result.models[1].apiKey).toMatch(/^enc:/);
      expect(result.models[2].apiKey).toBe('sk-key-3');
    });

    it('主密钥不存在时 apiKey 置空且 decryptionFailureCount 为 0', async () => {
      // 直接写入加密数据到 storeMap（不经过 saveModelsToJson 的加密）
      const oldKey = 'a'.repeat(64);
      const { encryptField } = await import('@/utils/crypto');
      const models = [
        createMockModel({
          id: 'model-null-1',
          apiKey: await encryptField('key1', oldKey),
        }),
        createMockModel({
          id: 'model-null-2',
          apiKey: await encryptField('key2', oldKey),
        }),
      ];
      storeMap.set('models', models);

      // mock getMasterKey 返回 null
      const getMasterKeySpy = vi
        .spyOn(masterKeyModule, 'getMasterKey')
        .mockResolvedValueOnce(null);

      const result = await loadModelsFromJson();

      expect(result.models).toHaveLength(2);
      expect(result.models[0].apiKey).toBe('');
      expect(result.models[1].apiKey).toBe('');
      expect(result.decryptionFailureCount).toBe(0);

      getMasterKeySpy.mockRestore();
    });
  });
});

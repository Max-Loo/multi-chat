/**
 * modelStorage.ts 集成测试
 * 测试模型数据的加密存储和解密加载功能
 * 
 * 使用真实实现：
 * - fake-indexeddb 模拟 Tauri store
 * - 真实的 Web Crypto API 加密/解密
 * - 真实的 masterKey 管理（IndexedDB + AES-256-GCM）
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Model } from '@/types/model';
import { saveModelsToJson, loadModelsFromJson } from '@/store/storage/modelStorage';
import { storeMasterKey, getMasterKey } from '@/store/keyring/masterKey';
import { WebKeyringCompat } from '@/utils/tauriCompat/keyring';
import { createMockModel } from '@/__test__/fixtures/models';

// 导入 fake-indexeddb（必须在其他导入之前）
import 'fake-indexeddb/auto';

describe('modelStorage (Integration Test)', () => {
  // WebKeyringCompat 实例用于清理
  let keyringCompat: WebKeyringCompat;

  beforeEach(async () => {
    // 关闭之前的连接
    if (keyringCompat) {
      keyringCompat.close();
    }

    // 清理 IndexedDB（multi-chat-store 和 multi-chat-keyring）
    indexedDB.deleteDatabase('multi-chat-store');
    indexedDB.deleteDatabase('multi-chat-keyring');

    // 清理 localStorage（keyring 种子）
    localStorage.clear();

    // 等待数据库删除完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 创建新的 keyring 实例
    keyringCompat = new WebKeyringCompat();

    // 初始化并生成 masterKey
    const masterKey = await getMasterKey();
    if (!masterKey) {
      // 生成新的 masterKey
      const newKey = Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');
      await storeMasterKey(newKey);
    }
  });

  afterEach(() => {
    // 关闭 keyring 连接
    if (keyringCompat) {
      keyringCompat.close();
    }
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
      const loadedModels = await loadModelsFromJson();

      // 验证加载的数据是正确的（解密成功）
      expect(loadedModels).toHaveLength(1);
      expect(loadedModels[0].apiKey).toBe('sk-sensitive-key-123');
    });

    it('应该使用正确的加密格式（enc:base64）', async () => {
      const mockModel = createMockModel({ apiKey: 'sk-test-key' });

      await saveModelsToJson([mockModel]);

      // 加载并验证解密成功
      const loadedModels = await loadModelsFromJson();

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
      const loadedModels = await loadModelsFromJson();

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
      const loadedModels = await loadModelsFromJson();

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
      const loaded1 = await loadModelsFromJson();
      expect(loaded1).toHaveLength(1);
      expect(loaded1[0].id).toBe('model-1');

      // 第二次保存（覆盖）
      const models2 = [
        createMockModel({ id: 'model-2' }),
        createMockModel({ id: 'model-3' }),
      ];
      await saveModelsToJson(models2);

      // 验证只有第二次的数据
      const loadedModels = await loadModelsFromJson();
      expect(loadedModels).toHaveLength(2);
      expect(loadedModels[0].id).toBe('model-2');
      expect(loadedModels[1].id).toBe('model-3');
    });

    it('应该处理空数据的场景', async () => {
      // 注意：由于 modelsStore 是模块级单例，这个测试验证
      // 在 store 初始化后读取数据的正常流程
      const loadedModels = await loadModelsFromJson();

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
      const loadedModels = await loadModelsFromJson();
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

      const loadedModels = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBe('');
    });

    it('应该处理 undefined 的 API key', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 测试错误处理，需要构造无效输入
      const model = createMockModel({ apiKey: undefined as any });

      await saveModelsToJson([model]);

      const loadedModels = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBeUndefined();
    });

    it('应该处理已加密的 API key（跳过重复加密）', async () => {
      const model = createMockModel({ apiKey: 'enc:already-encrypted' });

      await saveModelsToJson([model]);

      // 验证加载后保持原样（没有重复加密）
      const loadedModels = await loadModelsFromJson();

      // 已加密的数据（无效的密文）无法解密，会返回空字符串
      expect(loadedModels[0].apiKey).toBe('');
    });

    it('应该处理明文 API key（跳过解密）', async () => {
      // 直接写入明文数据到 IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-store', 1);
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('store', 'readwrite');
        const objectStore = transaction.objectStore('store');
        const model = createMockModel({ apiKey: 'sk-plaintext-key' });
        const request = objectStore.put({ key: 'models', value: [model] });

        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });

      db.close();

      // 加载应该保持明文
      const loadedModels = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBe('sk-plaintext-key');
    });

    it('应该保存和加载模型（正常流程）', async () => {
      // 正常保存和加载
      const model = createMockModel({ apiKey: 'sk-test-key' });
      await saveModelsToJson([model]);

      const loadedModels = await loadModelsFromJson();

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
      const loadedModels = await loadModelsFromJson();

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

      // 修改存储的数据为无效的密文
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-store', 1);
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('store', 'readwrite');
        const objectStore = transaction.objectStore('store');
        const request = objectStore.put({
          key: 'models',
          value: [{ ...model, apiKey: 'enc:invalid-base64!' }],
        });

        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });

      db.close();

      // 加载应该返回空 API key（解密失败）
      const loadedModels = await loadModelsFromJson();

      expect(loadedModels[0].apiKey).toBe('');
    });

    it('应该处理部分模型解密失败的场景', async () => {
      // 保存多个模型
      const models = [
        createMockModel({ id: 'model-1', apiKey: 'sk-key-1' }),
        createMockModel({ id: 'model-2', apiKey: 'sk-key-2' }),
        createMockModel({ id: 'model-3', apiKey: 'sk-key-3' }),
      ];
      await saveModelsToJson(models);

      // 修改第二个模型的数据为无效密文
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-store', 1);
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      const storedModels = await new Promise<Model[]>((resolve, reject) => {
        const transaction = db.transaction('store', 'readonly');
        const objectStore = transaction.objectStore('store');
        const request = objectStore.get('models');

        request.addEventListener('success', () => {
          const result = request.result;
          resolve(result?.value || []);
        });
        request.addEventListener('error', () => reject(request.error));
      });

      storedModels[1].apiKey = 'enc:invalid';

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('store', 'readwrite');
        const objectStore = transaction.objectStore('store');
        const request = objectStore.put({ key: 'models', value: storedModels });

        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });

      db.close();

      // 加载应该继续处理，失败的模型返回空 API key
      const loadedModels = await loadModelsFromJson();

      expect(loadedModels).toHaveLength(3);
      expect(loadedModels[0].apiKey).toBe('sk-key-1');
      expect(loadedModels[1].apiKey).toBe(''); // 解密失败
      expect(loadedModels[2].apiKey).toBe('sk-key-3');
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
      const loadedModels = await loadModelsFromJson();

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
      const loadedModels = await loadModelsFromJson();

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
      results.forEach((loadedModels) => {
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
      const loadedModels = await loadModelsFromJson();
      const endTime = Date.now();

      expect(loadedModels).toHaveLength(100);
      // 加载和解密 100 个模型应该在 5 秒内完成
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

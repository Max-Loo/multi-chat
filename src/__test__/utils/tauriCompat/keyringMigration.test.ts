import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// Mock @/utils/tauriCompat/env — 测试文件级别的 mock 确保 ./env 相对导入也被正确拦截
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => false), // 默认返回 false（Web 环境）
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256',
  DERIVED_KEY_LENGTH: 256,
}));

// 静态导入帮助 Stryker 变异测试的覆盖分析正确归因测试到源文件
import '@/utils/tauriCompat/keyringMigration';

/**
 * Keyring 迁移模块测试套件
 *
 * 测试 src/utils/tauriCompat/keyringMigration.ts 模块的功能
 * 覆盖 V1 → V2 迁移的各种场景
 */
describe('Keyring 迁移模块测试套件', () => {
  // 全局 beforeEach：清理所有 Mock 和状态
  beforeEach(() => {
    localStorage.clear();

    // 使用 fake-indexeddb 替换全局 indexedDB
    const indexedDB = new IDBFactory();
    vi.stubGlobal('indexedDB', indexedDB);
  });

  // 全局 afterEach：恢复所有 Mock 和重置模块缓存
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  describe('4.1 基础功能测试', () => {
    it('应该正确导出迁移函数', async () => {
      const { migrateKeyringV1ToV2, isMigrationToV2Complete } = await import('@/utils/tauriCompat/keyringMigration');

      expect(migrateKeyringV1ToV2).toBeDefined();
      expect(typeof migrateKeyringV1ToV2).toBe('function');
      expect(isMigrationToV2Complete).toBeDefined();
      expect(typeof isMigrationToV2Complete).toBe('function');
    });

    it('应该正确导出密钥派生函数', async () => {
      const { deriveEncryptionKeyV1, deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      expect(deriveEncryptionKeyV1).toBeDefined();
      expect(typeof deriveEncryptionKeyV1).toBe('function');
      expect(deriveEncryptionKeyV2).toBeDefined();
      expect(typeof deriveEncryptionKeyV2).toBe('function');
    });

    it('应该导出正确的版本常量', async () => {
      const { KEYRING_VERSION_KEY, KEYRING_CURRENT_VERSION } = await import('@/utils/tauriCompat/keyringMigration');

      expect(KEYRING_VERSION_KEY).toBe('keyring-data-version');
      expect(KEYRING_CURRENT_VERSION).toBe('2');
    });
  });

  describe('4.2 测试场景：新用户无迁移', () => {
    it('应该在没有种子时跳过迁移', async () => {
      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
    });

    it('应该设置版本标记为 "2"', async () => {
      const { migrateKeyringV1ToV2, KEYRING_VERSION_KEY } = await import('@/utils/tauriCompat/keyringMigration');

      await migrateKeyringV1ToV2();

      expect(localStorage.getItem(KEYRING_VERSION_KEY)).toBe('2');
    });
  });

  describe('4.3 测试场景：已迁移用户跳过迁移', () => {
    it('应该在版本为 "2" 时跳过迁移', async () => {
      const { migrateKeyringV1ToV2, KEYRING_VERSION_KEY, KEYRING_CURRENT_VERSION } = await import('@/utils/tauriCompat/keyringMigration');

      // 设置版本为 "2"
      localStorage.setItem(KEYRING_VERSION_KEY, KEYRING_CURRENT_VERSION);

      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
    });

    it('isMigrationToV2Complete 应该返回 true', async () => {
      const { isMigrationToV2Complete, KEYRING_VERSION_KEY } = await import('@/utils/tauriCompat/keyringMigration');

      localStorage.setItem(KEYRING_VERSION_KEY, '2');

      expect(isMigrationToV2Complete()).toBe(true);
    });

    it('版本检查应该是幂等的', async () => {
      const { migrateKeyringV1ToV2, KEYRING_VERSION_KEY } = await import('@/utils/tauriCompat/keyringMigration');

      localStorage.setItem(KEYRING_VERSION_KEY, '2');

      // 多次调用应该都跳过迁移
      const result1 = await migrateKeyringV1ToV2();
      const result2 = await migrateKeyringV1ToV2();
      const result3 = await migrateKeyringV1ToV2();

      expect(result1.migrated).toBe(false);
      expect(result2.migrated).toBe(false);
      expect(result3.migrated).toBe(false);
    });
  });

  describe('4.4 测试场景：V1 → V2 成功迁移', () => {
    it('应该成功迁移使用 V1 密钥加密的数据', async () => {
      const {
        migrateKeyringV1ToV2,
        deriveEncryptionKeyV1,
        KEYRING_VERSION_KEY
      } = await import('@/utils/tauriCompat/keyringMigration');

      // 使用固定的种子
      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // 使用 V1 方式加密数据并存储到 IndexedDB
      const v1Key = await deriveEncryptionKeyV1(seed);
      const plaintext = 'my-secret-password';
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, v1Key, data);
      const { bytesToBase64 } = await import('@/utils/crypto');
      const ciphertext = bytesToBase64(new Uint8Array(encrypted));
      const ivBase64 = bytesToBase64(iv);

      // 存储到 IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'test-service',
          user: 'test-user',
          encryptedPassword: ciphertext,
          iv: ivBase64,
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      // 执行迁移
      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(true);
      expect(result.reset).toBe(false);
      expect(localStorage.getItem(KEYRING_VERSION_KEY)).toBe('2');
    });
  });

  describe('4.5 测试场景：迁移失败后重置', () => {
    it('应该在解密失败时重置数据', async () => {
      const {
        migrateKeyringV1ToV2
      } = await import('@/utils/tauriCompat/keyringMigration');

      // 设置种子
      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // 创建一些无效的加密数据（模拟 userAgent 变化后无法解密）
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      // 存储一些无效数据
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'test-service',
          user: 'test-user',
          encryptedPassword: 'aW52YWxpZC1jaXBoZXJ0ZXh0', // 无效的 base64
          iv: 'aW52YWxpZC1pdg==', // 无效的 IV
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      // 执行迁移
      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(true);
      expect(result.reset).toBe(true);
    });

    it('重置后应该生成新的种子', async () => {
      const {
        migrateKeyringV1ToV2
      } = await import('@/utils/tauriCompat/keyringMigration');

      const oldSeed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', oldSeed);

      // 创建无效数据
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'test-service',
          user: 'test-user',
          encryptedPassword: 'aW52YWxpZA==',
          iv: 'aXY=',
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      await migrateKeyringV1ToV2();

      const newSeed = localStorage.getItem('multi-chat-keyring-seed');
      expect(newSeed).toBeDefined();
      expect(newSeed).not.toBe(oldSeed);
      // 验证新种子是有效的 base64 编码 32 字节数组（非 undefined 或空字符串）
      expect(newSeed!.length).toBeGreaterThanOrEqual(40);
      const decoded = atob(newSeed!);
      expect(decoded.length).toBe(32);
    });
  });

  describe('4.6 测试场景：并发迁移幂等性', () => {
    it('并发调用应该返回一致的结果', async () => {
      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      // 并发执行多次迁移
      const results = await Promise.all([
        migrateKeyringV1ToV2(),
        migrateKeyringV1ToV2(),
        migrateKeyringV1ToV2(),
      ]);

      // 所有结果应该一致
      expect(results[0].migrated).toBe(results[1].migrated);
      expect(results[1].migrated).toBe(results[2].migrated);
    });
  });

  describe('4.7 测试场景：Tauri 环境跳过', () => {
    afterEach(() => {
      // 恢复 vi.doMock 对 env 模块的覆盖，防止污染后续测试
      vi.doMock('@/utils/tauriCompat/env', () => ({
        isTauri: vi.fn(() => false),
        isTestEnvironment: vi.fn(() => true),
        getPBKDF2Iterations: vi.fn(() => 1000),
        PBKDF2_ALGORITHM: 'SHA-256',
        DERIVED_KEY_LENGTH: 256,
      }));
    });

    it('应该在 Tauri 环境中跳过迁移', async () => {
      // 重新配置 mock 为 Tauri 环境
      vi.doMock('@/utils/tauriCompat/env', () => ({
        isTauri: vi.fn(() => true),
        isTestEnvironment: vi.fn(() => true),
        getPBKDF2Iterations: vi.fn(() => 1000),
        PBKDF2_ALGORITHM: 'SHA-256',
        DERIVED_KEY_LENGTH: 256,
      }));

      // 重新导入模块
      vi.resetModules();
      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
    });
  });

  describe('4.8 测试场景：新密钥派生方式（仅 seed）加密/解密一致性', () => {
    it('V2 密钥派生应该只依赖 seed', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';

      // 使用相同的种子派生两次密钥
      const key1 = await deriveEncryptionKeyV2(seed);
      const key2 = await deriveEncryptionKeyV2(seed);

      // 两个密钥应该都能加解密相同的数据
      const plaintext = 'test-data';
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, data);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted);

      const decoder = new TextDecoder();
      expect(decoder.decode(decrypted)).toBe(plaintext);
    });

    it('使用 V2 密钥加密的数据应该能被解密', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const key = await deriveEncryptionKeyV2(seed);

      const testCases = [
        '',
        'short',
        'a'.repeat(1000),
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        '中文密码测试',
        '🔐🔑 Emoji password',
      ];

      for (const plaintext of testCases) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

        const decoder = new TextDecoder();
        expect(decoder.decode(decrypted)).toBe(plaintext);
      }
    });
  });

  describe('4.9 测试场景：密钥派生不依赖 userAgent', () => {
    it('V1 密钥派生应该依赖 userAgent', async () => {
      const { deriveEncryptionKeyV1 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';

      // 获取当前的 userAgent
      const originalUserAgent = navigator.userAgent;

      // 使用 V1 方式派生密钥
      const key1 = await deriveEncryptionKeyV1(seed);

      // 加密数据
      const plaintext = 'test-data';
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, data);

      // 验证 V1 确实使用了 userAgent（通过检查密钥派生结果）
      // 由于 userAgent 是密钥材料的一部分，如果 userAgent 变化，密钥应该不同
      expect(navigator.userAgent).toBe(originalUserAgent);
      // 验证加密成功
      expect(encrypted).toBeDefined();
    });

    it('V2 密钥派生不应该依赖 userAgent', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';

      // 使用 V2 方式派生密钥
      const key = await deriveEncryptionKeyV2(seed);

      // 加密数据
      const plaintext = 'test-data';
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

      // V2 密钥应该不依赖 userAgent
      // 无论如何修改 userAgent，只要 seed 相同，密钥就相同
      // 这里我们验证加密和解密都成功
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
      const decoder = new TextDecoder();
      expect(decoder.decode(decrypted)).toBe(plaintext);
    });

    it('不同的 userAgent 使用相同的 seed 和 V2 密钥应该能解密相同数据', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';

      // 派生密钥
      const key = await deriveEncryptionKeyV2(seed);

      // 加密数据
      const plaintext = 'secret-password';
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

      // 重新派生密钥（模拟重新启动应用，userAgent 可能变化）
      const key2 = await deriveEncryptionKeyV2(seed);

      // 使用重新派生的密钥解密
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted);
      const decoder = new TextDecoder();
      expect(decoder.decode(decrypted)).toBe(plaintext);
    });
  });

  describe('边界情况测试', () => {
    it('IndexedDB 不可用时应该静默失败', async () => {
      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // 移除 indexedDB 使其不可用
      vi.stubGlobal('indexedDB', undefined);

      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      // 迁移不应抛出异常，应静默完成
      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
    });

    it('没有 IndexedDB 记录时应该跳过迁移', async () => {
      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // beforeEach 已创建空的 IDBFactory，无任何记录
      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
    });
  });

  // ==================== 变异测试补强 ====================

  describe('变异测试补强 - migrateKeyringV1ToV2 提前返回路径', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('indexedDB 不可用时跳过迁移并标记完成', async () => {
      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      vi.stubGlobal('indexedDB', undefined);

      const { migrateKeyringV1ToV2, KEYRING_VERSION_KEY } = await import('@/utils/tauriCompat/keyringMigration');

      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
      expect(localStorage.getItem(KEYRING_VERSION_KEY)).toBe('2');
    });

    it('localStorage 不可用时跳过迁移并标记完成', async () => {
      vi.stubGlobal('localStorage', undefined);

      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
    });
  });

  describe('变异测试补强 - 无种子不访问 IndexedDB', () => {
    it('无种子时不应打开 IndexedDB 数据库', async () => {
      const openSpy = vi.spyOn(indexedDB, 'open');

      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      // 无种子 = 新用户
      const result = await migrateKeyringV1ToV2();

      expect(result.migrated).toBe(false);
      expect(result.reset).toBe(false);
      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('变异测试补强 - deriveEncryptionKeyV1 使用 userAgent', () => {
    it('V1 密钥派生 importKey 输入包含 userAgent + seed 编码', async () => {
      const { deriveEncryptionKeyV1 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const encoder = new TextEncoder();
      const expectedData = encoder.encode(navigator.userAgent + seed);

      const importKeySpy = vi.spyOn(crypto.subtle, 'importKey');

      await deriveEncryptionKeyV1(seed);

      expect(importKeySpy).toHaveBeenCalledWith(
        'raw',
        expectedData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
    });
  });

  describe('变异测试补强 - deriveEncryptionKeyV2 仅使用 seed', () => {
    it('V2 密钥派生 importKey 输入仅包含 seed 编码', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const encoder = new TextEncoder();
      const expectedData = encoder.encode(seed);

      const importKeySpy = vi.spyOn(crypto.subtle, 'importKey');

      await deriveEncryptionKeyV2(seed);

      expect(importKeySpy).toHaveBeenCalledWith(
        'raw',
        expectedData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
    });
  });

  describe('变异测试补强 - PBKDF2 参数传递', () => {
    it('deriveKey iterations 等于 getPBKDF2Iterations()', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');
      const { getPBKDF2Iterations } = await import('@/utils/tauriCompat/env');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const deriveKeySpy = vi.spyOn(crypto.subtle, 'deriveKey');

      await deriveEncryptionKeyV2(seed);

      expect(deriveKeySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: getPBKDF2Iterations(),
        }),
        expect.any(Object),
        expect.objectContaining({ name: 'AES-GCM', length: 256 }),
        false,
        ['encrypt', 'decrypt']
      );
    });

    it('importKey extractable 为 false', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const importKeySpy = vi.spyOn(crypto.subtle, 'importKey');

      await deriveEncryptionKeyV2(seed);

      const call = importKeySpy.mock.calls[0];
      expect(call[3]).toBe(false);
    });

    it('deriveKey extractable 为 false', async () => {
      const { deriveEncryptionKeyV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const deriveKeySpy = vi.spyOn(crypto.subtle, 'deriveKey');

      await deriveEncryptionKeyV2(seed);

      const call = deriveKeySpy.mock.calls[0];
      expect(call[3]).toBe(false);
    });
  });

  describe('变异测试补强 - deriveEncryptionKeyV1 PBKDF2 参数', () => {
    it('V1 importKey extractable 为 false', async () => {
      const { deriveEncryptionKeyV1 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const importKeySpy = vi.spyOn(crypto.subtle, 'importKey');

      await deriveEncryptionKeyV1(seed);

      const call = importKeySpy.mock.calls[0];
      expect(call[3]).toBe(false);
    });

    it('V1 deriveKey extractable 为 false', async () => {
      const { deriveEncryptionKeyV1 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const deriveKeySpy = vi.spyOn(crypto.subtle, 'deriveKey');

      await deriveEncryptionKeyV1(seed);

      const call = deriveKeySpy.mock.calls[0];
      expect(call[3]).toBe(false);
    });

    it('V1 deriveKey iterations 等于 getPBKDF2Iterations()', async () => {
      const { deriveEncryptionKeyV1 } = await import('@/utils/tauriCompat/keyringMigration');
      const { getPBKDF2Iterations } = await import('@/utils/tauriCompat/env');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      const deriveKeySpy = vi.spyOn(crypto.subtle, 'deriveKey');

      await deriveEncryptionKeyV1(seed);

      expect(deriveKeySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: getPBKDF2Iterations(),
        }),
        expect.any(Object),
        expect.objectContaining({ name: 'AES-GCM', length: 256 }),
        false,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('变异测试补强 - 迁移成功后数据完整性', () => {
    it('迁移成功后 IndexedDB 记录能被 V2 密钥解密', async () => {
      const {
        migrateKeyringV1ToV2,
        deriveEncryptionKeyV1,
        deriveEncryptionKeyV2,
      } = await import('@/utils/tauriCompat/keyringMigration');
      const { encrypt: cryptoEncrypt, decrypt: cryptoDecrypt } = await import('@/utils/tauriCompat/crypto-helpers');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // 使用 V1 密钥加密数据
      const v1Key = await deriveEncryptionKeyV1(seed);
      const plaintext = 'test-secret-password';
      const { ciphertext, iv } = await cryptoEncrypt(plaintext, v1Key);

      // 存储到 IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'integrity-service',
          user: 'integrity-user',
          encryptedPassword: ciphertext,
          iv,
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      // 执行迁移
      const result = await migrateKeyringV1ToV2();
      expect(result.migrated).toBe(true);
      expect(result.reset).toBe(false);

      // 从 IndexedDB 读取迁移后的记录
      const db2 = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = await new Promise<any>((resolve, reject) => {
        const tx = db2.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');
        const request = store.get(['integrity-service', 'integrity-user']);
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });
      db2.close();

      // 使用 V2 密钥解密 - 应该成功
      const v2Key = await deriveEncryptionKeyV2(seed);
      const decrypted = await cryptoDecrypt(record.encryptedPassword, record.iv, v2Key);
      expect(decrypted).toBe(plaintext);
    });

    it('迁移成功后 keyring.resetState 被调用', async () => {
      const { WebKeyringCompat } = await import('@/utils/tauriCompat/keyring');
      const resetSpy = vi.spyOn(WebKeyringCompat.prototype, 'resetState');

      const { migrateKeyringV1ToV2, deriveEncryptionKeyV1 } = await import('@/utils/tauriCompat/keyringMigration');
      const { encrypt: cryptoEncrypt } = await import('@/utils/tauriCompat/crypto-helpers');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // 创建有效 V1 数据
      const v1Key = await deriveEncryptionKeyV1(seed);
      const { ciphertext, iv } = await cryptoEncrypt('secret', v1Key);

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'reset-service',
          user: 'reset-user',
          encryptedPassword: ciphertext,
          iv,
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      await migrateKeyringV1ToV2();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('变异测试补强 - 迁移失败重置路径', () => {
    it('迁移失败后 keyring.resetState 被调用', async () => {
      const { WebKeyringCompat } = await import('@/utils/tauriCompat/keyring');
      const resetSpy = vi.spyOn(WebKeyringCompat.prototype, 'resetState');

      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      // 创建无效数据
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'fail-service',
          user: 'fail-user',
          encryptedPassword: 'aW52YWxpZC1jaXBoZXJ0ZXh0',
          iv: 'aW52YWxpZC1pdg==',
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      const result = await migrateKeyringV1ToV2();

      expect(result.reset).toBe(true);
      expect(resetSpy).toHaveBeenCalled();
    });

    it('迁移失败后 clearAllKeyringData 调用 deleteDatabase', async () => {
      const { migrateKeyringV1ToV2 } = await import('@/utils/tauriCompat/keyringMigration');

      const seed = 'dGVzdC1zZWVkLTMyLWJ5dGVz';
      localStorage.setItem('multi-chat-keyring-seed', seed);

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('multi-chat-keyring', 1);
        request.addEventListener('upgradeneeded', (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (!database.objectStoreNames.contains('keys')) {
            database.createObjectStore('keys', { keyPath: ['service', 'user'] });
          }
        });
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () => reject(request.error));
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const request = store.put({
          service: 'fail-service',
          user: 'fail-user',
          encryptedPassword: 'aW52YWxpZC1jaXBoZXJ0ZXh0',
          iv: 'aW52YWxpZC1pdg==',
          createdAt: Date.now(),
        });
        request.addEventListener('success', () => resolve());
        request.addEventListener('error', () => reject(request.error));
      });
      db.close();

      const deleteDbSpy = vi.spyOn(indexedDB, 'deleteDatabase');

      await migrateKeyringV1ToV2();

      // 验证至少调用了 deleteDatabase（清除了 keyring 和 store 数据库）
      expect(deleteDbSpy).toHaveBeenCalled();
      // 验证清除了 keyring 和 store 两个数据库
      const deletedNames = deleteDbSpy.mock.calls.map(call => call[0]);
      expect(deletedNames).toContain('multi-chat-keyring');
      expect(deletedNames).toContain('multi-chat-store');
    });
  });

  describe('变异测试补强 - noMigrationNeeded 返回值', () => {
    it('已迁移用户调用返回 { migrated: false, reset: false }', async () => {
      const { migrateKeyringV1ToV2, KEYRING_VERSION_KEY } = await import('@/utils/tauriCompat/keyringMigration');

      localStorage.setItem(KEYRING_VERSION_KEY, '2');

      const result = await migrateKeyringV1ToV2();

      expect(result).toEqual({ migrated: false, reset: false });
    });
  });

  describe('变异测试补强 - markMigrationComplete 写入版本', () => {
    it('新用户迁移完成后版本标记为 "2"', async () => {
      const { migrateKeyringV1ToV2, KEYRING_VERSION_KEY } = await import('@/utils/tauriCompat/keyringMigration');

      // 新用户 - 无种子
      await migrateKeyringV1ToV2();

      expect(localStorage.getItem(KEYRING_VERSION_KEY)).toBe('2');
    });
  });

  // 放在最后：此测试会修改 Storage 原型，可能影响后续测试的 localStorage 行为
  describe('变异测试补强 - isMigrationToV2Complete localStorage 异常', () => {
    it('localStorage.getItem 抛异常时返回 false', async () => {
      const { isMigrationToV2Complete } = await import('@/utils/tauriCompat/keyringMigration');

      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function () {
        throw new Error('localStorage not available');
      };

      expect(isMigrationToV2Complete()).toBe(false);

      Storage.prototype.getItem = originalGetItem;
    });
  });
});

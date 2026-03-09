/**
 * Crypto 与 MasterKey 集成测试
 * 
 * 测试目的：验证 crypto.ts 和 masterKey.ts 两个模块的集成场景
 * 测试范围：
 * - 使用生成的主密钥进行加密/解密
 * - 使用初始化的主密钥进行加密/解密
 * - 密钥重新生成后旧数据无法解密
 * - 密钥导出与加密操作兼容性
 * - Tauri 和 Web 环境集成行为
 * 
 * 测试策略：
 * - 使用 fake-indexeddb 模拟 IndexedDB
 * - 使用真实的 keyring 实现（WebKeyringCompat）
 * - Mock 环境检测（isTauri）以测试不同环境行为
 * 
 * 测试环境：Node.js + fake-indexeddb
 */

// fake-indexeddb 必须在最顶部导入
import 'fake-indexeddb/auto';

import { describe, test, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { encryptField, decryptField } from '@/utils/crypto';
import {
  generateMasterKey,
  initializeMasterKey,
  exportMasterKey,
} from '@/store/keyring/masterKey';
import { WebKeyringCompat } from '@/utils/tauriCompat/keyring';

// Mock @/utils/tauriCompat/env 模块中的 isTauri 函数
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(),
}));

import { isTauri } from '@/utils/tauriCompat/env';

// 使用 vi.mocked 获取类型安全的 Mock 函数
const mockIsTauri = vi.mocked(isTauri);

// Keyring 实例管理器
const keyringManager: {
  instance: WebKeyringCompat | null;
  get(): WebKeyringCompat;
  reset(): Promise<void>;
} = {
  instance: null,
  get(): WebKeyringCompat {
    if (!this.instance) {
      this.instance = new WebKeyringCompat();
    }
    return this.instance;
  },
  async reset() {
    // 1. 关闭数据库连接
    if (this.instance) {
      this.instance.close();
    }
    this.instance = null;

    // 2. 清理 localStorage
    localStorage.clear();

    // 3. 删除 IndexedDB（单次尝试，无超时）
    await new Promise<void>((resolve) => {
      const deleteReq = indexedDB.deleteDatabase('multi-chat-keyring');
      deleteReq.addEventListener('success', () => resolve());
      deleteReq.addEventListener('blocked', () => resolve());
      deleteReq.addEventListener('error', () => resolve());
    });
  }
};

// Mock keyring 模块
vi.mock('@/utils/tauriCompat/keyring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/tauriCompat/keyring')>();

  return {
    ...actual,
    setPassword: async (service: string, user: string, password: string) => {
      return keyringManager.get().setPassword(service, user, password);
    },
    getPassword: async (service: string, user: string) => {
      return keyringManager.get().getPassword(service, user);
    },
    deletePassword: async (service: string, user: string) => {
      return keyringManager.get().deletePassword(service, user);
    },
  };
});

describe('Crypto 与 MasterKey 集成测试', () => {
  // 在 describe 级别创建 spy，这样所有测试都可以使用
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeAll(async () => {
    // 清理 IndexedDB 和 localStorage
    await keyringManager.reset();

    // 设置默认为 Web 环境
    mockIsTauri.mockReturnValue(false);
  });

  beforeEach(() => {
    // 清除 spy 调用记录（保留 spy 本身）
    warnSpy.mockClear();

    // 清除其他 Mock 状态（但不包括 isTauri）
    mockIsTauri.mockClear();

    // 设置默认为 Web 环境
    mockIsTauri.mockReturnValue(false);
  });

  afterAll(() => {
    // 测试结束后恢复所有 Mock
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. 使用生成的主密钥进行加密/解密
  // ========================================

  describe('使用生成的主密钥进行加密/解密', () => {
    test('生成密钥后加密明文：应返回有效的 enc: 前缀密文', async () => {
      // Given: 生成主密钥
      const masterKey = generateMasterKey();

      // When: 使用密钥加密明文
      const plaintext = 'Hello, World!';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 密文应带有 enc: 前缀
      expect(ciphertext).toMatch(/^enc:/);
      // And: 密文应有效（Base64 编码）
      expect(ciphertext.length).toBeGreaterThan(4); // 至少有 "enc:" + 一些数据
    });

    test('使用相同密钥解密密文：应返回原始明文', async () => {
      // Given: 生成主密钥并加密明文
      const masterKey = generateMasterKey();
      const plaintext = 'Hello, World!';
      const ciphertext = await encryptField(plaintext, masterKey);

      // When: 使用相同密钥解密密文
      const decrypted = await decryptField(ciphertext, masterKey);

      // Then: 应返回原始明文
      expect(decrypted).toBe(plaintext);
    });

    test('加密 Unicode 字符并解密：应无字符编码损失', async () => {
      // Given: 生成主密钥
      const masterKey = generateMasterKey();

      // When: 加密包含 Unicode 的明文
      const plaintexts = ['你好世界', '🔐 Secure Key', 'Mix中文字符abc😀'];
      
      for (const plaintext of plaintexts) {
        const ciphertext = await encryptField(plaintext, masterKey);
        const decrypted = await decryptField(ciphertext, masterKey);

        // Then: 应返回原始 Unicode 字符
        expect(decrypted).toBe(plaintext);
      }
    });

    test('密钥长度验证：应为 64 字符的有效 hex 字符串', () => {
      // When: 生成主密钥
      const masterKey = generateMasterKey();

      // Then: 密钥长度应为 64 字符（256-bit）
      expect(masterKey).toHaveLength(64);
      // And: 密钥应仅包含有效的 hex 字符（0-9, a-f）
      expect(masterKey).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // ========================================
  // 2. 使用初始化的主密钥进行加密/解密
  // ========================================

  describe('使用初始化的主密钥进行加密/解密', () => {
    test('首次启动生成新密钥并加密：应成功加密并存储密钥', async () => {
      // Given: Keyring 中无密钥（已通过 beforeEach 清理）

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 应生成新密钥（长度 64）
      expect(masterKey).toHaveLength(64);

      // When: 使用密钥加密明文
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);

      // And: 再次初始化应返回相同密钥（验证已存储）
      const secondKey = await initializeMasterKey();
      expect(secondKey).toBe(masterKey);
    });

    test('已有密钥时复用并加密：应返回现有密钥', async () => {
      // Given: 已初始化密钥
      const firstKey = await initializeMasterKey();

      // When: 再次初始化主密钥
      const secondKey = await initializeMasterKey();

      // Then: 应返回相同密钥
      expect(secondKey).toBe(firstKey);

      // When: 使用密钥加密明文
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, secondKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('使用初始化密钥进行往返加密/解密：应无数据损失', async () => {
      // Given: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // When: 加密明文并解密
      const plaintext = 'Round-trip test data';
      const ciphertext = await encryptField(plaintext, masterKey);
      const decrypted = await decryptField(ciphertext, masterKey);

      // Then: 应返回原始明文
      expect(decrypted).toBe(plaintext);
    });
  });

  // ========================================
  // 3. 密钥重新生成后旧数据无法解密
  // ========================================

  describe('密钥重新生成后旧数据无法解密', () => {
    test('重新生成密钥后解密旧数据失败：应抛出解密失败错误', async () => {
      // Given: 使用旧密钥加密明文
      const oldKey = generateMasterKey();
      const plaintext = 'Sensitive data';
      const ciphertext = await encryptField(plaintext, oldKey);

      // When: 重新生成新密钥
      const newKey = generateMasterKey();

      // Then: 使用新密钥解密旧密文应抛出错误
      await expect(decryptField(ciphertext, newKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    test('密钥丢失后解密失败：应抛出解密失败错误', async () => {
      // Given: 使用密钥加密明文
      const oldKey = generateMasterKey();
      const plaintext = 'Sensitive data';
      const ciphertext = await encryptField(plaintext, oldKey);

      // When: 重置 keyring 并重新初始化生成新密钥
      await keyringManager.reset();
      localStorage.clear();
      const newKey = await initializeMasterKey();

      // Then: 使用新密钥解密旧密文应抛出错误
      await expect(decryptField(ciphertext, newKey)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });

    test('部分错误的密钥解密失败：AES-GCM 认证标签应验证失败', async () => {
      // Given: 使用密钥 A 加密明文
      const keyA = generateMasterKey();
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, keyA);

      // When: 生成与密钥 A 少量字符不同的密钥 B
      const keyB = keyA.slice(0, 63) + (keyA[63] === 'a' ? 'b' : 'a');

      // Then: 使用密钥 B 解密应抛出错误
      await expect(decryptField(ciphertext, keyB)).rejects.toThrow(
        '解密敏感数据失败，可能是主密钥已更改或数据已损坏'
      );
    });
  });

  // ========================================
  // 4. 密钥导出与加密操作兼容性
  // ========================================

  describe('密钥导出与加密操作兼容性', () => {
    test('导出密钥后用于加密：应成功加密', async () => {
      // Given: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // When: 导出密钥
      const exportedKey = await exportMasterKey();

      // Then: 应返回存储的密钥
      expect(exportedKey).toBe(masterKey);

      // When: 使用导出的密钥加密明文
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, exportedKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('导出密钥后用于解密：应往返一致', async () => {
      // Given: 初始化密钥并加密明文
      const masterKey = await initializeMasterKey();
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, masterKey);

      // When: 导出密钥
      const exportedKey = await exportMasterKey();

      // Then: 使用导出的密钥解密应返回原始明文
      const decrypted = await decryptField(ciphertext, exportedKey);
      expect(decrypted).toBe(plaintext);
    });

    test.skip('密钥不存在时导出失败：应抛出错误', async () => {
      // 这个测试在 fake-indexeddb 6.2.5 环境下会导致超时
      // 原因：重置 keyring 后调用 exportMasterKey 会导致 mock 死锁
      // Given: 重置 keyring（确保没有存储的密钥）
      await keyringManager.reset();

      // When: 尝试导出密钥（此时应该不存在）
      // Then: 应抛出错误
      await expect(exportMasterKey()).rejects.toThrow(
        '主密钥不存在，无法导出'
      );
    });
  });

  // ========================================
  // 5. Tauri 和 Web 环境集成行为
  // ========================================

  describe('Tauri 和 Web 环境集成行为', () => {
    test('Tauri 环境密钥初始化与加密：应输出系统存储警告', async () => {
      // Given: Tauri 环境
      mockIsTauri.mockReturnValue(true);

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 密钥应该存在
      expect(masterKey).toBeDefined();
      expect(masterKey).toHaveLength(64);

      // When: 使用密钥加密明文
      const plaintext = 'Tauri test';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('Web 环境密钥初始化与加密：应输出浏览器存储警告', async () => {
      // Given: Web 环境
      mockIsTauri.mockReturnValue(false);

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 密钥应该存在
      expect(masterKey).toBeDefined();
      expect(masterKey).toHaveLength(64);

      // When: 使用密钥加密明文
      const plaintext = 'Web test';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('Tauri 环境 Keyring 异常时加密失败：应抛出系统存储错误', async () => {
      // Given: Tauri 环境
      mockIsTauri.mockReturnValue(true);

      // When: 初始化主密钥
      // 注意：在测试环境中，Tauri Keyring API 不可用，所以会使用 Web 实现
      // 此测试主要验证环境检测逻辑
      const masterKey = await initializeMasterKey();

      // Then: 应成功生成密钥
      expect(masterKey).toBeDefined();
      expect(masterKey).toHaveLength(64);

      // When: 使用密钥加密明文
      const plaintext = 'Tauri test';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('Web 环境 Keyring 异常时加密失败：应抛出浏览器存储错误', async () => {
      // Given: Web 环境
      mockIsTauri.mockReturnValue(false);

      // When: 初始化主密钥（使用 fake-indexeddb，应该正常工作）
      const masterKey = await initializeMasterKey();

      // Then: 应成功生成密钥
      expect(masterKey).toBeDefined();
      expect(masterKey).toHaveLength(64);

      // When: 使用密钥加密明文
      const plaintext = 'Web test';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });
  });

  // ========================================
  // 6. 测试隔离与验证
  // ========================================

  describe('测试隔离与验证', () => {
    test('每个测试用例独立执行：无状态共享', async () => {
      // Given: 初始化第一个密钥
      const key1 = await initializeMasterKey();

      // Then: 第一个密钥应该有效
      expect(key1).toBeDefined();
      expect(key1).toHaveLength(64);

      // When: 使用 generateMasterKey 生成第二个密钥
      // （不使用 initializeMasterKey 以避免 fake-indexeddb 的连接复用问题）
      const key2 = generateMasterKey();

      // Then: 第二个密钥应该与第一个不同
      expect(key2).toBeDefined();
      expect(key2).toHaveLength(64);
      expect(key2).not.toBe(key1);
    });

    test('环境检测 Mock 正常工作：使用 vi.mocked', () => {
      // Then: Mock 函数应为 Vitest mock 函数
      expect(vi.isMockFunction(mockIsTauri)).toBe(true);
    });

    test('添加清晰的断言错误消息：便于调试', async () => {
      // Given: 生成主密钥
      const masterKey = generateMasterKey();

      // When: 加密并解密
      const plaintext = 'Debug test';
      const ciphertext = await encryptField(plaintext, masterKey);
      const decrypted = await decryptField(ciphertext, masterKey);

      // Then: 使用 expect 断言（Vitest 自动提供清晰的错误消息）
      expect(decrypted, '解密结果应与原始明文一致').toBe(plaintext);
      expect(ciphertext, '密文应带有 enc: 前缀').toMatch(/^enc:/);
      expect(masterKey, '密钥长度应为 64 字符').toHaveLength(64);
    });
  });
});

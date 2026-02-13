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
 * 测试隔离：所有外部依赖（@/utils/tauriCompat）均被 Mock，不依赖真实 Keyring
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptField, decryptField } from '@/utils/crypto';
import {
  generateMasterKey,
  initializeMasterKey,
  exportMasterKey,
} from '@/store/keyring/masterKey';

// Mock @/utils/tauriCompat 模块
vi.mock('@/utils/tauriCompat', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  isTauri: vi.fn(),
}));

import { getPassword, setPassword, isTauri } from '@/utils/tauriCompat';

// 使用 vi.mocked 获取类型安全的 Mock 函数
const mockGetPassword = vi.mocked(getPassword);
const mockSetPassword = vi.mocked(setPassword);
const mockIsTauri = vi.mocked(isTauri);

describe('Crypto 与 MasterKey 集成测试', () => {
  beforeEach(() => {
    // 每个测试用例前重置 Mock 状态
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 每个测试用例后验证 Mock 调用
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
    test('首次启动生成新密钥并加密：应成功加密并调用 setPassword', async () => {
      // Given: Keyring 中无密钥
      mockGetPassword.mockResolvedValue(null);
      mockSetPassword.mockResolvedValue(undefined);

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 应生成新密钥（长度 64）
      expect(masterKey).toHaveLength(64);
      // And: setPassword 应被调用一次（存储新密钥）
      expect(mockSetPassword).toHaveBeenCalledTimes(1);

      // When: 使用密钥加密明文
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('已有密钥时复用并加密：应返回现有密钥且不调用 setPassword', async () => {
      // Given: Keyring 中已有密钥
      const existingKey = 'a'.repeat(64);
      mockGetPassword.mockResolvedValue(existingKey);
      mockSetPassword.mockResolvedValue(undefined);

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 应返回现有密钥
      expect(masterKey).toBe(existingKey);
      // And: setPassword 不应被调用（不存储新密钥）
      expect(mockSetPassword).not.toHaveBeenCalled();

      // When: 使用密钥加密明文
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('使用初始化密钥进行往返加密/解密：应无数据损失', async () => {
      // Given: 初始化主密钥
      mockGetPassword.mockResolvedValue(null);
      mockSetPassword.mockResolvedValue(undefined);
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

      // When: Keyring 中密钥被清除，重新初始化生成新密钥
      mockGetPassword.mockResolvedValue(null);
      mockSetPassword.mockResolvedValue(undefined);
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
      // Given: Keyring 中已存储密钥
      const existingKey = 'a'.repeat(64);
      mockGetPassword.mockResolvedValue(existingKey);

      // When: 导出密钥
      const exportedKey = await exportMasterKey();

      // Then: 应返回存储的密钥
      expect(exportedKey).toBe(existingKey);

      // When: 使用导出的密钥加密明文
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, exportedKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);
    });

    test('导出密钥后用于解密：应往返一致', async () => {
      // Given: 使用密钥加密明文
      const key = 'a'.repeat(64);
      const plaintext = 'Test data';
      const ciphertext = await encryptField(plaintext, key);

      // When: 导出相同密钥
      mockGetPassword.mockResolvedValue(key);
      const exportedKey = await exportMasterKey();

      // Then: 使用导出的密钥解密应返回原始明文
      const decrypted = await decryptField(ciphertext, exportedKey);
      expect(decrypted).toBe(plaintext);
    });

    test('密钥不存在时导出失败：应抛出错误', async () => {
      // Given: Keyring 中无密钥
      mockGetPassword.mockResolvedValue(null);

      // When: 导出密钥
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
      // Given: Tauri 环境，Keyring 中无密钥
      const warnSpy = vi.spyOn(console, 'warn');
      mockIsTauri.mockReturnValue(true);
      mockGetPassword.mockResolvedValue(null);
      mockSetPassword.mockResolvedValue(undefined);

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 应输出包含 "system secure storage" 的警告
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('system secure storage')
      );

      // When: 使用密钥加密明文
      const plaintext = 'Tauri test';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);

      warnSpy.mockRestore();
    });

    test('Web 环境密钥初始化与加密：应输出浏览器存储警告', async () => {
      // Given: Web 环境，Keyring 中无密钥
      const warnSpy = vi.spyOn(console, 'warn');
      mockIsTauri.mockReturnValue(false);
      mockGetPassword.mockResolvedValue(null);
      mockSetPassword.mockResolvedValue(undefined);

      // When: 初始化主密钥
      const masterKey = await initializeMasterKey();

      // Then: 应输出包含 "browser secure storage (IndexedDB + encryption)" 的警告
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('browser secure storage (IndexedDB + encryption)')
      );

      // When: 使用密钥加密明文
      const plaintext = 'Web test';
      const ciphertext = await encryptField(plaintext, masterKey);

      // Then: 应成功加密
      expect(ciphertext).toMatch(/^enc:/);

      warnSpy.mockRestore();
    });

    test('Tauri 环境 Keyring 异常时加密失败：应抛出系统存储错误', async () => {
      // Given: Tauri 环境，getPassword 抛出异常
      mockIsTauri.mockReturnValue(true);
      mockGetPassword.mockRejectedValue(new Error('Keyring error'));

      // When: 初始化主密钥
      // Then: 应抛出包含 "无法访问系统安全存储" 的错误
      await expect(initializeMasterKey()).rejects.toThrow(
        '无法访问系统安全存储，请检查钥匙串权限设置或重新启动应用'
      );
    });

    test('Web 环境 Keyring 异常时加密失败：应抛出浏览器存储错误', async () => {
      // Given: Web 环境，getPassword 抛出异常
      mockIsTauri.mockReturnValue(false);
      mockGetPassword.mockRejectedValue(new Error('IndexedDB error'));

      // When: 初始化主密钥
      // Then: 应抛出包含 "无法访问浏览器安全存储或密钥解密失败" 的错误
      await expect(initializeMasterKey()).rejects.toThrow(
        '无法访问浏览器安全存储或密钥解密失败'
      );
    });
  });

  // ========================================
  // 6. 测试隔离与验证
  // ========================================

  describe('测试隔离与验证', () => {
    test('每个测试用例独立执行：无状态共享', async () => {
      // Given: 配置 Mock 返回值
      mockGetPassword.mockResolvedValue('test-key-123');
      mockSetPassword.mockResolvedValue(undefined);

      // When: 执行测试逻辑
      await exportMasterKey();      
      // Then: 验证 Mock 调用
      expect(mockGetPassword).toHaveBeenCalledTimes(1);

      // 重置 Mock 状态（模拟下一个测试用例）
      mockGetPassword.mockClear();
      mockGetPassword.mockResolvedValue('test-key-456');

      // When: 再次执行
      const key2 = await exportMasterKey();

      // Then: 新测试用例应使用新配置
      expect(mockGetPassword).toHaveBeenCalledTimes(1);
      expect(key2).toBe('test-key-456');
    });

    test('Mock 不调用真实 Keyring：使用 vi.mocked', () => {
      // Then: Mock 函数应为 Vitest mock 函数
      expect(vi.isMockFunction(mockGetPassword)).toBe(true);
      expect(vi.isMockFunction(mockSetPassword)).toBe(true);
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

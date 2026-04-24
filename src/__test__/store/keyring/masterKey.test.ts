/**
 * masterKey 完整测试套件
 *
 * 测试策略：
 * - 使用 keyring 实例 mock 隔离外部依赖
 * - 测试正常流程和错误处理
 * - 测试跨平台兼容性（Tauri vs Web 环境）
 * - 测试安全警告和密钥导出功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keyring } from '@/utils/tauriCompat/keyring';
import * as tauriEnv from '@/utils/tauriCompat/env';
import { toastQueue } from '@/services/toast';
import { createToastSpies } from '@/__test__/helpers/mocks/toast';
import {
  generateMasterKey,
  isMasterKeyExists,
  getMasterKey,
  storeMasterKey,
  initializeMasterKey,
  handleSecurityWarning,
  exportMasterKey,
  importMasterKey,
  importMasterKeyWithValidation,
} from '@/store/keyring/masterKey';

// Mock keyVerification 模块
vi.mock('@/store/keyring/keyVerification', () => ({
  verifyMasterKey: vi.fn(),
  resetVerificationStore: vi.fn(),
}));

import { verifyMasterKey } from '@/store/keyring/keyVerification';

describe('masterKey 完整测试套件', () => {
  beforeEach(() => {
    localStorage.clear();

    // Mock keyring 实例方法
    vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
    vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);
    vi.spyOn(keyring, 'deletePassword').mockResolvedValue(undefined);

    // Mock verifyMasterKey 默认返回 null（无加密数据）
    vi.mocked(verifyMasterKey).mockResolvedValue(null);

    // Mock isTauri（默认为 false）
    vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);

    // Mock toastQueue
    createToastSpies(toastQueue);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateMasterKey', () => {
    it('应该生成 64 个字符的密钥', () => {
      const key = generateMasterKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('应该生成不同的密钥 每次调用', () => {
      const key1 = generateMasterKey();
      const key2 = generateMasterKey();
      expect(key1).not.toBe(key2);
    });

    it('应该生成 256-bit 密钥（32 字节）', () => {
      const key = generateMasterKey();
      const bytes = [];
      for (let i = 0; i < key.length; i += 2) {
        bytes.push(parseInt(key.substr(i, 2), 16));
      }
      expect(bytes.length).toBe(32);
    });
  });

  describe('isMasterKeyExists', () => {
    it('应该返回 true 当密钥存在时', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue('test-key-123');
      
      const exists = await isMasterKeyExists();
      
      expect(exists).toBe(true);
      expect(keyring.getPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key');
    });

    it('应该返回 false 当密钥不存在时', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      
      const exists = await isMasterKeyExists();
      
      expect(exists).toBe(false);
    });

    it('应该返回 false 当密钥为空字符串', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue('');
      
      const exists = await isMasterKeyExists();
      
      expect(exists).toBe(false);
    });

    it('应该返回 false 当 getPassword 抛出错误', async () => {
      vi.spyOn(keyring, 'getPassword').mockRejectedValue(new Error('Access denied'));
      
      const exists = await isMasterKeyExists();
      
      expect(exists).toBe(false);
    });
  });

  describe('getMasterKey', () => {
    it('应该返回密钥字符串当密钥存在时', async () => {
      const testKey = 'a'.repeat(64);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(testKey);
      
      const key = await getMasterKey();
      
      expect(key).toBe(testKey);
    });

    it('应该返回 null 当密钥不存在时', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      
      const key = await getMasterKey();
      
      expect(key).toBeNull();
    });

    it('应该抛出错误 当 getPassword 在 Web 环境失败', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);
      vi.spyOn(keyring, 'getPassword').mockRejectedValue(new Error('IndexedDB error'));

      await expect(getMasterKey()).rejects.toThrow('浏览器不支持安全存储或存储空间不足');
    });

    it('应该抛出错误 当 getPassword 在 Tauri 环境失败', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(true);
      vi.spyOn(keyring, 'getPassword').mockRejectedValue(new Error('Keychain error'));
      
      await expect(getMasterKey()).rejects.toThrow();
    });
  });

  describe('storeMasterKey', () => {
    it('应该成功存储密钥', async () => {
      const testKey = 'b'.repeat(64);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);
      
      await storeMasterKey(testKey);
      
      expect(keyring.setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', testKey);
    });

    it('应该抛出错误 当 setPassword 在 Web 环境失败', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);
      vi.spyOn(keyring, 'setPassword').mockRejectedValue(new Error('IndexedDB error'));

      await expect(storeMasterKey('a'.repeat(64))).rejects.toThrow('浏览器不支持安全存储或存储空间不足');
    });

    it('应该抛出错误 当 setPassword 在 Tauri 环境失败', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(true);
      vi.spyOn(keyring, 'setPassword').mockRejectedValue(new Error('Keychain error'));
      
      await expect(storeMasterKey('a'.repeat(64))).rejects.toThrow();
    });
  });

  describe('initializeMasterKey', () => {
    it('应该返回已存在的密钥 当密钥已存在', async () => {
      const existingKey = 'c'.repeat(64);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(existingKey);

      const result = await initializeMasterKey();

      expect(result.key).toBe(existingKey);
      expect(result.isNewlyGenerated).toBe(false);
      expect(keyring.getPassword).toHaveBeenCalled();
      expect(keyring.setPassword).not.toHaveBeenCalled();
    });

    it('应该生成并存储新密钥 当密钥不存在', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      const result = await initializeMasterKey();

      expect(result.key).toHaveLength(64);
      expect(result.key).toMatch(/^[0-9a-f]{64}$/);
      expect(result.isNewlyGenerated).toBe(true);
      expect(keyring.setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', result.key);
    });

    it('应该在 Web 环境生成密钥时输出安全警告', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await initializeMasterKey();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('A new master key has been generated and stored in browser secure storage')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Old encrypted data cannot be decrypted')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security notice: The web version has a lower security level')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('应该在 Tauri 环境生成密钥时输出警告', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(true);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await initializeMasterKey();
      
      // 检查是否输出了警告（至少有一条警告）
      expect(consoleWarnSpy).toHaveBeenCalled();
      // 检查是否输出了关于旧数据无法解密的警告
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Old encrypted data cannot be decrypted')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('应该传播错误 当获取密钥失败', async () => {
      vi.spyOn(keyring, 'getPassword').mockRejectedValue(new Error('Access denied'));
      
      await expect(initializeMasterKey()).rejects.toThrow();
    });

    it('应该传播错误 当存储密钥失败', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      vi.spyOn(keyring, 'setPassword').mockRejectedValue(new Error('Storage error'));
      
      await expect(initializeMasterKey()).rejects.toThrow();
    });
  });

  describe('handleSecurityWarning', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('应该在 Web 环境显示安全警告', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);

      await handleSecurityWarning();

      // 验证 toastQueue.warning 被调用且包含安全提示消息
      expect(toastQueue.warning).toHaveBeenCalledWith(
        expect.stringContaining('web version has a lower security level'),
        expect.objectContaining({
          duration: Infinity,
          action: expect.objectContaining({
            label: 'OK',
          }),
        }),
      );
    });

    it('应该在 Tauri 环境不显示警告', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(true);

      await handleSecurityWarning();

      // Tauri 环境下 toastQueue.warning 不应被调用
      expect(toastQueue.warning).not.toHaveBeenCalled();
    });

    it('不应该显示警告 当用户已确认过', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);
      localStorage.setItem('multi-chat-security-warning-dismissed', 'true');

      await handleSecurityWarning();

      // 用户已确认，toastQueue.warning 不应被调用
      expect(toastQueue.warning).not.toHaveBeenCalled();
    });
  });

  describe('exportMasterKey', () => {
    it('应该成功导出密钥 当密钥存在', async () => {
      const testKey = 'd'.repeat(64);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(testKey);
      
      const key = await exportMasterKey();
      
      expect(key).toBe(testKey);
    });

    it('应该抛出错误 当密钥不存在', async () => {
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      
      await expect(exportMasterKey()).rejects.toThrow('主密钥不存在，无法导出');
    });

    it('应该传播错误 当获取密钥失败', async () => {
      vi.spyOn(keyring, 'getPassword').mockRejectedValue(new Error('Access denied'));
      
      await expect(exportMasterKey()).rejects.toThrow();
    });
  });

  describe('importMasterKey', () => {
    it('应该成功导入有效的 hex 密钥', async () => {
      const testKey = 'a'.repeat(64);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      await importMasterKey(testKey);

      expect(keyring.setPassword).toHaveBeenCalledWith('com.multichat.app', 'master-key', testKey);
    });

    it('应该拒绝长度不足的密钥', async () => {
      await expect(importMasterKey('abc123')).rejects.toThrow('密钥格式无效，请输入 64 字符的 hex 编码字符串');
      expect(keyring.setPassword).not.toHaveBeenCalled();
    });

    it('应该拒绝包含非 hex 字符的密钥', async () => {
      await expect(importMasterKey('g'.repeat(64))).rejects.toThrow('密钥格式无效，请输入 64 字符的 hex 编码字符串');
      expect(keyring.setPassword).not.toHaveBeenCalled();
    });

    it('应该拒绝包含大写字母的密钥', async () => {
      await expect(importMasterKey('A'.repeat(64))).rejects.toThrow('密钥格式无效，请输入 64 字符的 hex 编码字符串');
      expect(keyring.setPassword).not.toHaveBeenCalled();
    });

    it('应该拒绝空字符串', async () => {
      await expect(importMasterKey('')).rejects.toThrow('密钥格式无效，请输入 64 字符的 hex 编码字符串');
      expect(keyring.setPassword).not.toHaveBeenCalled();
    });

    it('应该传播错误 当存储密钥失败', async () => {
      vi.spyOn(keyring, 'setPassword').mockRejectedValue(new Error('Storage error'));

      await expect(importMasterKey('a'.repeat(64))).rejects.toThrow();
    });
  });

  describe('跨平台兼容性', () => {
    it('应该在 Web 环境正常工作', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(false);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      const result = await initializeMasterKey();

      expect(result.key).toHaveLength(64);
      expect(result.isNewlyGenerated).toBe(true);
    });

    it('应该在 Tauri 环境正常工作', async () => {
      vi.spyOn(tauriEnv, 'isTauri').mockReturnValue(true);
      vi.spyOn(keyring, 'getPassword').mockResolvedValue(null);
      vi.spyOn(keyring, 'setPassword').mockResolvedValue(undefined);

      const result = await initializeMasterKey();

      expect(result.key).toHaveLength(64);
      expect(result.isNewlyGenerated).toBe(true);
    });
  });

  describe('importMasterKeyWithValidation', () => {
    it('应该返回格式错误 当密钥格式无效', async () => {
      const result = await importMasterKeyWithValidation('invalid');

      expect(result.success).toBe(false);
      expect(result.keyMatched).toBeNull();
      expect(result.error).toContain('密钥格式无效');
    });

    it('应该成功导入 当验证通过', async () => {
      vi.mocked(verifyMasterKey).mockResolvedValue(true);

      const result = await importMasterKeyWithValidation('a'.repeat(64));

      expect(result.success).toBe(true);
      expect(result.keyMatched).toBe(true);
      expect(keyring.setPassword).toHaveBeenCalled();
    });

    it('应该返回 keyMatched=false 当密钥不匹配', async () => {
      vi.mocked(verifyMasterKey).mockResolvedValue(false);

      const result = await importMasterKeyWithValidation('a'.repeat(64));

      expect(result.success).toBe(false);
      expect(result.keyMatched).toBe(false);
      expect(keyring.setPassword).not.toHaveBeenCalled();
    });

    it('应该成功导入 当无加密数据跳过验证', async () => {
      vi.mocked(verifyMasterKey).mockResolvedValue(null);

      const result = await importMasterKeyWithValidation('a'.repeat(64));

      expect(result.success).toBe(true);
      expect(result.keyMatched).toBeNull();
      expect(keyring.setPassword).toHaveBeenCalled();
    });

    it('应该强制导入 当 forceImport=true 且密钥不匹配', async () => {
      vi.mocked(verifyMasterKey).mockResolvedValue(false);

      const result = await importMasterKeyWithValidation('a'.repeat(64), true);

      expect(result.success).toBe(true);
      expect(result.keyMatched).toBe(false);
      expect(keyring.setPassword).toHaveBeenCalled();
    });

    it('应该返回存储错误 当 setPassword 失败', async () => {
      vi.mocked(verifyMasterKey).mockResolvedValue(true);
      vi.spyOn(keyring, 'setPassword').mockRejectedValue(new Error('Storage error'));

      const result = await importMasterKeyWithValidation('a'.repeat(64));

      expect(result.success).toBe(false);
      expect(result.error).toContain('密钥导入失败');
    });
  });
});

/**
 * resetAllData 单元测试
 *
 * 覆盖清理逻辑和部分失败场景
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keyring } from '@/utils/platform/keyring';

describe('resetAllData', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(keyring, 'resetState').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('清理逻辑', () => {
    it('应该清除 localStorage 中的 keyring 相关项', async () => {
      localStorage.setItem('multi-chat-keyring-seed', 'test-seed');
      localStorage.setItem('keyring-data-version', '2');
      localStorage.setItem('multi-chat-security-warning-dismissed', 'true');
      localStorage.setItem('multi-chat-language', 'zh');

      const { resetAllData } = await import('@/utils/resetAllData');
      await resetAllData();

      expect(localStorage.getItem('multi-chat-keyring-seed')).toBeNull();
      expect(localStorage.getItem('keyring-data-version')).toBeNull();
      expect(localStorage.getItem('multi-chat-security-warning-dismissed')).toBeNull();
    });

    it('应该保留应用配置的 localStorage 项', async () => {
      localStorage.setItem('multi-chat-language', 'zh');
      localStorage.setItem('multi-chat-transmit-history-reasoning', 'true');
      localStorage.setItem('multi-chat-auto-naming-enabled', 'false');

      const { resetAllData } = await import('@/utils/resetAllData');
      await resetAllData();

      expect(localStorage.getItem('multi-chat-language')).toBe('zh');
      expect(localStorage.getItem('multi-chat-transmit-history-reasoning')).toBe('true');
      expect(localStorage.getItem('multi-chat-auto-naming-enabled')).toBe('false');
    });

    it('应该调用 keyring.resetState()', async () => {
      const { resetAllData } = await import('@/utils/resetAllData');
      await resetAllData();

      expect(keyring.resetState).toHaveBeenCalled();
    });

    it('应该不调用 deletePassword', async () => {
      vi.spyOn(keyring, 'deletePassword').mockResolvedValue(undefined);

      const { resetAllData } = await import('@/utils/resetAllData');
      await resetAllData();

      expect(keyring.deletePassword).not.toHaveBeenCalled();
    });
  });
});

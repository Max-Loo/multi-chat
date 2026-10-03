/**
 * resetAllData 单元测试
 *
 * 覆盖清理逻辑和保留配置场景
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keyring } from '@/utils/platform/keyring';

// 使用 vi.hoisted 确保 mock 在 hoisted 阶段可用
const { mockStoreMethods } = vi.hoisted(() => ({
  mockStoreMethods: globalThis.__createMemoryStorageMock(),
}));

vi.mock('@/utils/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/platform')>();
  return {
    ...actual,
    createLazyStore: vi.fn().mockReturnValue(mockStoreMethods),
  };
});

describe('resetAllData', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(keyring, 'deletePassword').mockResolvedValue(undefined);
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
      const { resetAllData } = await import('@/utils/resetAllData');
      await resetAllData();

      expect(keyring.deletePassword).not.toHaveBeenCalled();
    });
  });
});

/**
 * appConfig store 单元测试
 *
 * 测试应用配置管理、语言初始化、推理内容开关等核心功能
 *
 * 转写自 Redux appConfigSlices 测试，行为断言保持一致
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';

// Mock 依赖 - 必须在导入 store 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const { mockGetDefaultAppLanguage, mockChangeAppLanguage } = vi.hoisted(() => {
  return {
    mockGetDefaultAppLanguage: vi.fn(),
    mockChangeAppLanguage: vi.fn(),
  };
});

vi.mock('@/services/global', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/global')>();
  return {
    ...actual,
    getDefaultAppLanguage: mockGetDefaultAppLanguage,
  };
});

vi.mock('@/services/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/i18n')>();
  return {
    ...actual,
    changeAppLanguage: mockChangeAppLanguage,
    tSafely: actual.tSafely,
  };
});

// Mock toastQueue（队列在未 markReady 时会永久等待）
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn().mockResolvedValue('loading-id'),
    dismiss: vi.fn(),
    success: vi.fn().mockResolvedValue('success-id'),
    error: vi.fn().mockResolvedValue('error-id'),
    warning: vi.fn().mockResolvedValue('warning-id'),
    info: vi.fn().mockResolvedValue('info-id'),
  },
}));

import { useAppConfigStore } from '@/store/appConfig';

describe('appConfig store', () => {
  beforeEach(() => {
    // 重建 Pinia 实例，确保每个测试拿到全新 store
    setActivePinia(createPinia());

    // 重置 mock 返回默认值
    mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
    mockChangeAppLanguage.mockResolvedValue({ success: true });
    localStorage.clear();
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const store = useAppConfigStore();
      expect(store.language).toBe('');
      expect(store.transmitHistoryReasoning).toBe(false);
      expect(store.autoNamingEnabled).toBe(true);
    });
  });

  describe('initializeTransmitHistoryReasoning', () => {
    it('应该在 localStorage 存储值为 true 时返回 true', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      const store = useAppConfigStore();
      const result = await store.initializeTransmitHistoryReasoning();

      expect(result).toBe(true);
      expect(store.transmitHistoryReasoning).toBe(true);
    });

    it('应该在 localStorage 存储值为 false 时返回 false', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'false');

      const store = useAppConfigStore();
      const result = await store.initializeTransmitHistoryReasoning();

      expect(result).toBe(false);
      expect(store.transmitHistoryReasoning).toBe(false);
    });

    it('应该在 localStorage 中无值时返回 false（默认值）', async () => {
      const store = useAppConfigStore();
      const result = await store.initializeTransmitHistoryReasoning();

      expect(result).toBe(false);
      expect(store.transmitHistoryReasoning).toBe(false);
    });

    it('应该在 localStorage 抛错时传播错误', async () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const store = useAppConfigStore();

      await expect(store.initializeTransmitHistoryReasoning()).rejects.toThrow();

      getItemSpy.mockRestore();
    });

    it('应该使用正确的 localStorage 键', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      const store = useAppConfigStore();
      await store.initializeTransmitHistoryReasoning();

      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');
    });
  });

  describe('initializeAutoNamingEnabled', () => {
    it('应该在 localStorage 存储值为 false 时返回 false', async () => {
      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');

      const store = useAppConfigStore();
      const result = await store.initializeAutoNamingEnabled();

      expect(result).toBe(false);
      expect(store.autoNamingEnabled).toBe(false);
    });

    it('应该在 localStorage 中无值时返回 true（默认值）', async () => {
      const store = useAppConfigStore();
      const result = await store.initializeAutoNamingEnabled();

      expect(result).toBe(true);
      expect(store.autoNamingEnabled).toBe(true);
    });
  });

  describe('自动命名功能', () => {
    it('初始值应该为 true', () => {
      const store = useAppConfigStore();
      expect(store.autoNamingEnabled).toBe(true);
    });

    it('应该支持设置自动命名开关为 false 并持久化', () => {
      const store = useAppConfigStore();
      store.setAutoNamingEnabled(false);

      expect(store.autoNamingEnabled).toBe(false);
      expect(localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY)).toBe('false');
    });

    it('应该支持设置自动命名开关为 true', () => {
      const store = useAppConfigStore();

      // 先设置为 false
      store.setAutoNamingEnabled(false);

      // 再设置为 true
      store.setAutoNamingEnabled(true);

      expect(store.autoNamingEnabled).toBe(true);
      expect(localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY)).toBe('true');
    });
  });

  describe('传输推理内容开关', () => {
    it('应该支持设置开关并持久化', () => {
      const store = useAppConfigStore();

      store.setTransmitHistoryReasoning(true);
      expect(store.transmitHistoryReasoning).toBe(true);
      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');

      store.setTransmitHistoryReasoning(false);
      expect(store.transmitHistoryReasoning).toBe(false);
      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('false');
    });
  });

  describe('initializeAppLanguage', () => {
    it('应该使用检测结果更新语言并持久化', async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'zh', migrated: false });

      const store = useAppConfigStore();
      const lang = await store.initializeAppLanguage();

      expect(lang).toBe('zh');
      expect(store.language).toBe('zh');
      expect(localStorage.getItem('multi-chat-language')).toBe('zh');
    });

    it('应该在检测失败时传播错误', async () => {
      mockGetDefaultAppLanguage.mockRejectedValue(new Error('detect failed'));

      const store = useAppConfigStore();

      await expect(store.initializeAppLanguage()).rejects.toThrow();
    });
  });

  describe('setAppLanguage', () => {
    it('应该设置语言、持久化并切换 i18n 语言', async () => {
      const store = useAppConfigStore();

      await store.setAppLanguage('zh');

      expect(store.language).toBe('zh');
      expect(localStorage.getItem('multi-chat-language')).toBe('zh');
      expect(mockChangeAppLanguage).toHaveBeenCalledWith('zh');
    });
  });
});

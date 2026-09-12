/**
 * Pinia appConfig store 单元测试（Vue 版）
 *
 * 承接被删除的 Redux 版 appConfigSlices/appConfigMiddleware 测试的核心行为：
 * - 三个初始化 action（localStorage 恢复与默认值）
 * - 开关 set（持久化下沉）
 * - 语言切换（持久化 + i18n 联动 + Toast 反馈）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Mock Toast 队列（语言切换的加载/成功/失败反馈）
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn().mockResolvedValue('toast-id'),
    success: vi.fn().mockResolvedValue('toast-id'),
    error: vi.fn().mockResolvedValue('toast-id'),
    warning: vi.fn().mockResolvedValue('toast-id'),
    info: vi.fn().mockResolvedValue('toast-id'),
    dismiss: vi.fn(),
    promise: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/services/global', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/global')>();
  return {
    ...actual,
    getDefaultAppLanguage: vi.fn(),
  };
});

// Mock i18n 的语言切换（保留 tSafely 等其余导出）
vi.mock('@/services/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/i18n')>();
  return {
    ...actual,
    changeAppLanguage: vi.fn(),
  };
});

import { useAppConfigStore } from '@/store/pinia/appConfig';
import { getDefaultAppLanguage, LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';
import { changeAppLanguage } from '@/services/i18n';
import {
  LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
  LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
} from '@/utils/constants';

describe('Pinia appConfig store', () => {
  let store: ReturnType<typeof useAppConfigStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useAppConfigStore();
    vi.clearAllMocks();
    vi.mocked(getDefaultAppLanguage).mockResolvedValue({ lang: 'en', migrated: false } as never);
  });

  describe('initializeAppLanguage', () => {
    it('应读取浏览器语言并持久化', async () => {
      const lang = await store.initializeAppLanguage();

      expect(lang).toBe('en');
      expect(store.language).toBe('en');
      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('en');
    });

    it('读取失败时应抛出错误', async () => {
      vi.mocked(getDefaultAppLanguage).mockRejectedValueOnce(new Error('读取失败'));

      await expect(store.initializeAppLanguage()).rejects.toThrow('Failed to initialize language');
      expect(store.language).toBe('');
    });
  });

  describe('开关初始化', () => {
    it('initializeTransmitHistoryReasoning 应从 localStorage 恢复', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      const result = await store.initializeTransmitHistoryReasoning();

      expect(result).toBe(true);
      expect(store.transmitHistoryReasoning).toBe(true);
    });

    it('initializeAutoNamingEnabled 无值时默认开启', async () => {
      const result = await store.initializeAutoNamingEnabled();

      expect(result).toBe(true);
      expect(store.autoNamingEnabled).toBe(true);
    });

    it('initializeAutoNamingEnabled 值为 false 时关闭', async () => {
      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');

      const result = await store.initializeAutoNamingEnabled();

      expect(result).toBe(false);
    });
  });

  describe('开关设置（持久化下沉）', () => {
    it('setTransmitHistoryReasoning 应更新并持久化', () => {
      store.setTransmitHistoryReasoning(true);

      expect(store.transmitHistoryReasoning).toBe(true);
      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');
    });

    it('setAutoNamingEnabled 应更新并持久化', () => {
      store.setAutoNamingEnabled(false);

      expect(store.autoNamingEnabled).toBe(false);
      expect(localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY)).toBe('false');
    });
  });

  describe('setAppLanguage（语言切换）', () => {
    it('切换成功应更新状态、持久化并调用 i18n', async () => {
      vi.mocked(changeAppLanguage).mockResolvedValueOnce({ success: true } as never);

      await store.setAppLanguage('zh');

      expect(store.language).toBe('zh');
      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');
      expect(changeAppLanguage).toHaveBeenCalledWith('zh');
    });

    it('切换失败应反馈错误并保持持久化', async () => {
      vi.mocked(changeAppLanguage).mockRejectedValueOnce(new Error('加载失败'));

      await store.setAppLanguage('fr');

      expect(store.language).toBe('fr');
      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('fr');
    });
  });
});

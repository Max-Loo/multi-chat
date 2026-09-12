/**
 * 应用配置集成测试（Vue 版）
 *
 * 测试目的：验证应用配置变更与 Pinia、i18next、localStorage 的集成
 * 测试范围（承接被删除的 Redux 版 settings-change 集成测试的核心场景）：
 * - 语言切换：appConfig store → i18next 语言切换 → localStorage 持久化
 * - 开关初始化：localStorage → Pinia store 恢复
 *
 * 测试隔离：使用真实的 i18next 与 localStorage，mock platform 层存储后端与 Toast 队列
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/utils/platform/store', () => ({
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
}));

// Mock Toast 队列（集成测试不验证 Toast 排队行为，避免未就绪队列阻塞 Promise）
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

import { useAppConfigStore } from '@/store/pinia/appConfig';
import { initI18n, getInitI18nPromise, resetI18nForTest } from '@/services/i18n';
import {
  getDefaultAppLanguage,
  LOCAL_STORAGE_LANGUAGE_KEY,
} from '@/services/global';
import {
  LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
  LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
} from '@/utils/constants';

vi.mock('@/services/global', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/global')>();
  return {
    ...actual,
    getDefaultAppLanguage: vi.fn(),
  };
});

// getDefaultAppLanguage 默认返回系统语言（各用例可按需覆盖）
vi.mocked(getDefaultAppLanguage).mockResolvedValue({ lang: 'en', migrated: false } as never);

describe('设置变更集成测试（Vue 版）', () => {
  beforeEach(async () => {
    localStorage.clear();
    setActivePinia(createPinia());
    resetI18nForTest();
    // 初始化 i18n（真实实例）
    await getInitI18nPromise();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('语言切换流程', () => {
    it('用户切换语言 → store 更新 → i18next 更新 → localStorage 持久化', async () => {
      const appConfigStore = useAppConfigStore();
      const i18next = (await import('i18next')).default;

      await appConfigStore.setAppLanguage('zh');

      expect(appConfigStore.language).toBe('zh');
      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');
      // i18next 实际切换语言（等待懒加载完成）
      await vi.waitFor(() => {
        expect(i18next.language).toBe('zh');
      });
    });

    it('初始化语言步骤应从浏览器配置读取并写入 localStorage', async () => {
      vi.mocked(getDefaultAppLanguage).mockResolvedValue({ lang: 'en' } as never);

      const appConfigStore = useAppConfigStore();
      const lang = await appConfigStore.initializeAppLanguage();

      expect(lang).toBe('en');
      expect(appConfigStore.language).toBe('en');
      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('en');
    });
  });

  describe('开关配置流程', () => {
    it('设置传输推理内容开关 → store 更新 → localStorage 持久化', () => {
      const appConfigStore = useAppConfigStore();

      appConfigStore.setTransmitHistoryReasoning(true);

      expect(appConfigStore.transmitHistoryReasoning).toBe(true);
      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');
    });

    it('设置自动命名开关 → store 更新 → localStorage 持久化', () => {
      const appConfigStore = useAppConfigStore();

      appConfigStore.setAutoNamingEnabled(false);

      expect(appConfigStore.autoNamingEnabled).toBe(false);
      expect(localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY)).toBe('false');
    });

    it('初始化开关应从 localStorage 恢复状态', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');
      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');

      const appConfigStore = useAppConfigStore();
      const reasoning = await appConfigStore.initializeTransmitHistoryReasoning();
      const autoNaming = await appConfigStore.initializeAutoNamingEnabled();

      expect(reasoning).toBe(true);
      expect(autoNaming).toBe(false);
      expect(appConfigStore.transmitHistoryReasoning).toBe(true);
      expect(appConfigStore.autoNamingEnabled).toBe(false);
    });

    it('初始化开关在 localStorage 无值时使用默认值', async () => {
      const appConfigStore = useAppConfigStore();
      const reasoning = await appConfigStore.initializeTransmitHistoryReasoning();
      const autoNaming = await appConfigStore.initializeAutoNamingEnabled();

      expect(reasoning).toBe(false);
      expect(autoNaming).toBe(true);
    });
  });

  describe('i18n 初始化', () => {
    it('initI18n 应完成且提供翻译函数', async () => {
      const t = await initI18n();

      expect(t).toBeDefined();
      expect(typeof t).toBe('function');
    });
  });
});

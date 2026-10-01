/**
 * appConfigStore 单元测试
 *
 * 覆盖：初始化 action（localStorage 读取）、setter、持久化插件。
 * 语言切换 Toast 流程在插件层由 toast mock 断言。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 全局服务依赖
vi.mock('@/services/global', () => ({
  getDefaultAppLanguage: vi.fn(),
  LOCAL_STORAGE_LANGUAGE_KEY: 'multi-chat:language',
  getLanguageLabel: vi.fn((lang: string) => lang),
}));

vi.mock('@/services/i18n', () => ({
  tSafely: vi.fn((_key: string, fallback: string) => fallback),
  changeAppLanguage: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('@/services/toast/toastQueue', () => ({
  toastQueue: {
    info: vi.fn(() => Promise.resolve('id')),
    warning: vi.fn(() => Promise.resolve('id')),
    error: vi.fn(() => Promise.resolve('id')),
    success: vi.fn(() => Promise.resolve('id')),
    loading: vi.fn(() => Promise.resolve('loading-id')),
    dismiss: vi.fn(),
  },
}));

import { getDefaultAppLanguage, LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';
import { changeAppLanguage } from '@/services/i18n';
import { toastQueue } from '@/services/toast/toastQueue';
import { useAppConfigStore } from '@/stores/appConfigStore';
import { setupPinia } from './setupPinia';

describe('appConfigStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setupPinia();
  });

  describe('初始化 action', () => {
    it('initializeAppLanguage 应写入检测到的语言', async () => {
      vi.mocked(getDefaultAppLanguage).mockResolvedValue({
        lang: 'zh',
        migrated: false,
      } as Awaited<ReturnType<typeof getDefaultAppLanguage>>);

      const store = useAppConfigStore();
      const lang = await store.initializeAppLanguage();

      expect(lang).toBe('zh');
      expect(store.language).toBe('zh');
    });

    it('initializeTransmitHistoryReasoning 默认为 false', async () => {
      const store = useAppConfigStore();
      const value = await store.initializeTransmitHistoryReasoning();

      expect(value).toBe(false);
      expect(store.transmitHistoryReasoning).toBe(false);
    });

    it('initializeTransmitHistoryReasoning 读取 localStorage 的 true', async () => {
      localStorage.setItem('multi-chat-transmit-history-reasoning', 'true');

      const store = useAppConfigStore();
      const value = await store.initializeTransmitHistoryReasoning();

      expect(value).toBe(true);
      expect(store.transmitHistoryReasoning).toBe(true);
    });

    it('initializeAutoNamingEnabled 缺省为 true', async () => {
      const store = useAppConfigStore();
      const value = await store.initializeAutoNamingEnabled();

      expect(value).toBe(true);
      expect(store.autoNamingEnabled).toBe(true);
    });

    it("initializeAutoNamingEnabled 在 localStorage 为 'false' 时关闭", async () => {
      localStorage.setItem('multi-chat-auto-naming-enabled', 'false');

      const store = useAppConfigStore();
      const value = await store.initializeAutoNamingEnabled();

      expect(value).toBe(false);
      expect(store.autoNamingEnabled).toBe(false);
    });
  });

  describe('持久化插件', () => {
    it('setAppLanguage 应持久化语言并触发 i18n 切换与 Toast 流程', async () => {
      const store = useAppConfigStore();

      store.setAppLanguage('fr');
      // 插件的 after 钩子是异步的，让微任务跑完
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('fr');
      expect(changeAppLanguage).toHaveBeenCalledWith('fr');
      expect(toastQueue.success).toHaveBeenCalledWith('语言切换成功');
    });

    it('setTransmitHistoryReasoning 应持久化开关值', () => {
      const store = useAppConfigStore();

      store.setTransmitHistoryReasoning(true);

      expect(localStorage.getItem('multi-chat-transmit-history-reasoning')).toBe('true');
    });

    it('setAutoNamingEnabled 应持久化开关值', () => {
      const store = useAppConfigStore();

      store.setAutoNamingEnabled(false);

      expect(localStorage.getItem('multi-chat-auto-naming-enabled')).toBe('false');
    });

    it('initializeAppLanguage 应持久化检测到的语言', async () => {
      vi.mocked(getDefaultAppLanguage).mockResolvedValue({
        lang: 'ja',
        migrated: false,
      } as Awaited<ReturnType<typeof getDefaultAppLanguage>>);

      const store = useAppConfigStore();
      await store.initializeAppLanguage();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('ja');
    });
  });
});

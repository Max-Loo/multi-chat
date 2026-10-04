/**
 * 设置变更集成测试（Vue 版）
 *
 * 测试目的：验证设置变更的完整流程（用户操作 → Pinia → localStorage 持久化 → 恢复）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAppConfigStore } from '@/store/appConfig';
import { clearBrowserStorage } from './helpers';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({}).useTranslation(),
}));

// changeAppLanguage 含 i18next 初始化与重试退避，不在本测试的关注范围内（由 i18n 单测覆盖）
vi.mock('@/services/i18n', () => ({
  changeAppLanguage: vi.fn(async () => ({ success: true })),
  tSafely: (key: string, fallback: string) => fallback,
}));

// toastQueue 为全局单例且依赖 Toaster 挂载才消费队列；本测试关注持久化链路，mock 之
vi.mock('@/services/toast', () => ({
  toastQueue: {
    success: vi.fn(async () => 'toast-id'),
    error: vi.fn(async () => 'toast-id'),
    warning: vi.fn(async () => 'toast-id'),
    info: vi.fn(async () => 'toast-id'),
    loading: vi.fn(async () => 'toast-id'),
    dismiss: vi.fn(),
  },
}));

describe('设置变更集成测试', () => {
  beforeEach(async () => {
    await clearBrowserStorage();
    setActivePinia(createPinia());
  });

  describe('语言切换流程', () => {
    it('切换语言 → Pinia 更新 → localStorage 持久化', async () => {
      const appConfigStore = useAppConfigStore();

      await appConfigStore.setAppLanguage('en');

      expect(appConfigStore.language).toBe('en');
      // 持久化副作用（原 middleware）应写入 localStorage
      expect(localStorage.getItem('multi-chat-language')).toBe('en');
    });

    it('刷新后语言保持（重新初始化恢复）', async () => {
      const firstStore = useAppConfigStore();
      await firstStore.setAppLanguage('en');

      // 模拟刷新：新建 store（新的 pinia 实例）并执行初始化
      setActivePinia(createPinia());
      const secondStore = useAppConfigStore();
      const lang = await secondStore.initializeAppLanguage();

      expect(lang).toBe('en');
      expect(secondStore.language).toBe('en');
    });
  });

  describe('推理内容开关流程', () => {
    it('切换开关 → Pinia 更新 → localStorage 持久化', () => {
      const appConfigStore = useAppConfigStore();

      appConfigStore.setTransmitHistoryReasoning(true);

      expect(appConfigStore.transmitHistoryReasoning).toBe(true);
      expect(
        localStorage.getItem('multi-chat-transmit-history-reasoning'),
      ).toBe('true');

      appConfigStore.setTransmitHistoryReasoning(false);
      expect(
        localStorage.getItem('multi-chat-transmit-history-reasoning'),
      ).toBe('false');
    });

    it('刷新后开关状态恢复', async () => {
      const firstStore = useAppConfigStore();
      firstStore.setTransmitHistoryReasoning(true);

      setActivePinia(createPinia());
      const secondStore = useAppConfigStore();
      const value = await secondStore.initializeTransmitHistoryReasoning();

      expect(value).toBe(true);
      expect(secondStore.transmitHistoryReasoning).toBe(true);
    });
  });

  describe('自动命名开关流程', () => {
    it('切换开关 → Pinia 更新 → localStorage 持久化', () => {
      const appConfigStore = useAppConfigStore();

      appConfigStore.setAutoNamingEnabled(false);

      expect(appConfigStore.autoNamingEnabled).toBe(false);
      expect(localStorage.getItem('multi-chat-auto-naming-enabled')).toBe('false');

      // 连续切换
      appConfigStore.setAutoNamingEnabled(true);
      expect(appConfigStore.autoNamingEnabled).toBe(true);
      expect(localStorage.getItem('multi-chat-auto-naming-enabled')).toBe('true');
    });

    it('刷新后开关状态恢复', async () => {
      const firstStore = useAppConfigStore();
      firstStore.setAutoNamingEnabled(false);

      setActivePinia(createPinia());
      const secondStore = useAppConfigStore();
      const value = await secondStore.initializeAutoNamingEnabled();

      expect(value).toBe(false);
      expect(secondStore.autoNamingEnabled).toBe(false);
    });
  });
});

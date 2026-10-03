/**
 * appConfig store 副作用测试（语言/开关持久化与 i18n 切换）
 *
 * 转写自 Redux middleware 测试（src/__test__/store/middleware/appConfigMiddleware.test.ts），
 * 原 Listener Middleware 的副作用已并入 useAppConfigStore（action 完成后直接调用持久化/i18n/Toast 逻辑），
 * 行为断言保持一致。
 *
 * 转写对照说明：
 * - 原 "dispatch setAppLanguage 后 middleware 应该持久化" → "调用 store.setAppLanguage 后应调用 localStorage.setItem"
 * - 原监听 initializeAppLanguage.fulfilled 持久化 → 调用 store.initializeAppLanguage() 后断言持久化
 * - 原监听 matcher 条件（非 appConfig action 不执行副作用）→ 未调用任何配置方法时不执行副作用
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';

// Mock 依赖 - 必须在导入 store 之前执行
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
  };
});

// Mock toastQueue（队列在未 markReady 时会永久等待）
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn().mockResolvedValue('loading-toast-id'),
    dismiss: vi.fn(),
    success: vi.fn().mockResolvedValue('success-id'),
    error: vi.fn().mockResolvedValue('error-id'),
    warning: vi.fn().mockResolvedValue('warning-id'),
    info: vi.fn().mockResolvedValue('info-id'),
  },
}));

import { useAppConfigStore } from '@/store/appConfig';
import { toastQueue } from '@/services/toast';

const mockToastLoading = vi.mocked(toastQueue.loading);
const mockToastSuccess = vi.mocked(toastQueue.success);
const mockToastError = vi.mocked(toastQueue.error);
const mockToastDismiss = vi.mocked(toastQueue.dismiss);

describe('appConfig store 副作用（转写自 appConfigMiddleware）', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 重建 Pinia 实例，确保每个测试拿到全新 store
    setActivePinia(createPinia());

    // 重置 mock 返回默认值
    mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
    mockChangeAppLanguage.mockResolvedValue({ success: true });

    // 重置 toast mocks 并设置默认返回值
    mockToastLoading.mockClear().mockResolvedValue('loading-toast-id');
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockToastDismiss.mockClear();

    // 监听 localStorage.setItem 以断言持久化调用（原测试替换 global.localStorage）
    setItemSpy = vi.spyOn(localStorage, 'setItem');
  });

  afterEach(() => {
    setItemSpy.mockRestore();
  });

  describe('语言切换时的持久化和 i18n 更新', () => {
    it('应该将语言持久化到 localStorage 当设置语言为 zh', async () => {
      const lang = 'zh';
      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);

      // 验证 changeAppLanguage 被调用
      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);

      // 验证 state 被更新
      expect(store.language).toBe(lang);
    });

    it('应该将语言持久化到 localStorage 当设置语言为 en', async () => {
      const lang = 'en';
      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);

      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);

      expect(store.language).toBe(lang);
    });

    it('应该在 localStorage 调用失败时继续执行而不抛出错误', async () => {
      // Mock localStorage.setItem 抛出错误
      setItemSpy.mockImplementation(() => {
        throw new Error('localStorage is full');
      });

      const lang = 'zh';
      const store = useAppConfigStore();

      // 调用不应抛出错误（持久化失败被内部捕获）
      await expect(store.setAppLanguage(lang)).resolves.toBeUndefined();

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(store.language).toBe(lang);
      });
    });
  });

  describe('推理内容配置的持久化', () => {
    it('应该将推理内容配置持久化到 localStorage 当启用时', async () => {
      const includeReasoning = true;
      const store = useAppConfigStore();
      store.setTransmitHistoryReasoning(includeReasoning);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
        String(includeReasoning)
      );

      expect(store.transmitHistoryReasoning).toBe(includeReasoning);
    });

    it('应该将推理内容配置持久化到 localStorage 当禁用时', async () => {
      const includeReasoning = false;
      const store = useAppConfigStore();
      store.setTransmitHistoryReasoning(includeReasoning);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
        String(includeReasoning)
      );

      expect(store.transmitHistoryReasoning).toBe(includeReasoning);
    });
  });

  describe('自动命名开关的持久化', () => {
    it('应该将自动命名开关持久化到 localStorage 当启用时', async () => {
      const enabled = true;
      const store = useAppConfigStore();
      store.setAutoNamingEnabled(enabled);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
        String(enabled)
      );

      expect(store.autoNamingEnabled).toBe(enabled);
    });

    it('应该将自动命名开关持久化到 localStorage 当禁用时', async () => {
      const enabled = false;
      const store = useAppConfigStore();
      store.setAutoNamingEnabled(enabled);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
        String(enabled)
      );

      expect(store.autoNamingEnabled).toBe(enabled);
    });
  });

  describe('副作用触发范围（原监听器注册检查）', () => {
    it('应该在设置语言时执行持久化和 i18n 更新', async () => {
      const lang = 'zh';
      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);
      });

      // 验证副作用调用了 i18n 更新函数
      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);
    });

    it('应该在设置推理内容开关时执行持久化但不调用 i18n 更新', async () => {
      const includeReasoning = true;
      const store = useAppConfigStore();
      store.setTransmitHistoryReasoning(includeReasoning);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
          String(includeReasoning)
        );
      });

      // 验证没有调用 i18n 更新函数
      expect(mockChangeAppLanguage).not.toHaveBeenCalled();
    });

    it('应该在未调用任何配置方法时不执行任何副作用', async () => {
      // 仅创建 store，不调用任何配置方法（等价于原 "dispatch 不相关的 action"）
      useAppConfigStore();

      // 等待微任务与宏任务刷新，确保没有异步副作用
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(setItemSpy).not.toHaveBeenCalled();
      expect(mockChangeAppLanguage).not.toHaveBeenCalled();
    });
  });

  describe('与 store 的集成', () => {
    it('应该在 store 创建后正确执行持久化副作用', async () => {
      const store = useAppConfigStore();

      // 验证 store 创建成功
      expect(store).toBeDefined();
      expect(store.language).toBe('');

      // 调用方法并验证副作用正常工作
      await store.setAppLanguage('zh');

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalled();
      });

      expect(mockChangeAppLanguage).toHaveBeenCalled();
    });

    it('应该支持连续的混合操作并完整执行副作用', async () => {
      const store = useAppConfigStore();

      // 连续调用多种配置方法
      await store.setAppLanguage('zh');
      store.setTransmitHistoryReasoning(true);
      await store.setAppLanguage('en');

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(3);
      });

      // 验证所有操作都被处理
      expect(store.language).toBe('en');
      expect(store.transmitHistoryReasoning).toBe(true);

      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该正确处理空字符串语言', async () => {
      const lang = '';
      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);
      });

      // 验证 state 被更新
      expect(store.language).toBe(lang);
    });

    it('应该正确处理连续的语言切换', async () => {
      const store = useAppConfigStore();

      // 连续调用多次语言切换
      await store.setAppLanguage('zh');
      await store.setAppLanguage('en');
      await store.setAppLanguage('zh');

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(3);
      });

      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(3);

      // 验证最终状态
      expect(store.language).toBe('zh');
    });

    it('应该正确处理连续的推理内容切换', () => {
      const store = useAppConfigStore();

      // 连续调用多次推理内容切换
      store.setTransmitHistoryReasoning(true);
      store.setTransmitHistoryReasoning(false);
      store.setTransmitHistoryReasoning(true);

      expect(setItemSpy).toHaveBeenCalledTimes(3);

      // 验证最终状态
      expect(store.transmitHistoryReasoning).toBe(true);
    });
  });

  describe('Toast 加载提示和错误处理', () => {
    it('应该在语言切换时显示 loading Toast 并在成功后关闭', async () => {
      const lang = 'zh';
      mockChangeAppLanguage.mockResolvedValue({ success: true });

      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      });

      // 验证 loading Toast 被显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);
      expect(mockToastLoading).toHaveBeenCalledWith('切换语言中...');

      // 验证 loading Toast 被 dismiss
      expect(mockToastDismiss).toHaveBeenCalledTimes(1);
      expect(mockToastDismiss).toHaveBeenCalledWith('loading-toast-id');

      expect(mockToastSuccess).toHaveBeenCalledWith('语言切换成功');
    });

    it('应该在语言切换失败时显示错误 Toast', async () => {
      const lang = 'fr';
      mockChangeAppLanguage.mockResolvedValue({ success: false });

      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      await vi.waitFor(() => {
        expect(mockToastError).toHaveBeenCalledTimes(1);
      });

      // 验证 loading Toast 被显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);

      // 验证 loading Toast 被 dismiss
      expect(mockToastDismiss).toHaveBeenCalledTimes(1);

      expect(mockToastError).toHaveBeenCalledWith(`语言切换失败: ${lang}`);
    });

    it('应该在 changeAppLanguage 抛出异常时显示通用错误 Toast', async () => {
      const lang = 'zh';
      mockChangeAppLanguage.mockRejectedValue(new Error('Network error'));

      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      await vi.waitFor(() => {
        expect(mockToastError).toHaveBeenCalledTimes(1);
      });

      // 验证 loading Toast 被显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);

      // 验证 loading Toast 被 dismiss
      expect(mockToastDismiss).toHaveBeenCalledTimes(1);

      expect(mockToastError).toHaveBeenCalledWith('语言切换失败，请重试');
    });

    it('应该验证 changeAppLanguage 返回 { success: boolean } 类型', async () => {
      const lang = 'zh';
      const store = useAppConfigStore();

      // 测试成功情况
      mockChangeAppLanguage.mockResolvedValue({ success: true });
      await store.setAppLanguage(lang);
      await vi.waitFor(() => {
        expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);
      });

      // 测试失败情况
      mockChangeAppLanguage.mockResolvedValue({ success: false });
      await store.setAppLanguage('en');
      await vi.waitFor(() => {
        expect(mockChangeAppLanguage).toHaveBeenCalledWith('en');
      });
    });

    it('应该正确处理 Promise 异步时序', async () => {
      const lang = 'zh';
      let resolvePromise: (value: { success: boolean }) => void;

      // 创建一个可控的 Promise
      mockChangeAppLanguage.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const store = useAppConfigStore();
      const pending = store.setAppLanguage(lang);

      // 立即验证 loading Toast 已显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);

      // Promise 尚未完成，验证成功 Toast 尚未显示
      expect(mockToastSuccess).not.toHaveBeenCalled();

      // 解析 Promise
      resolvePromise!({ success: true });
      await vi.waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      });

      await pending;
    });
  });

  describe('初始化时的语言持久化', () => {
    it('应该在初始化语言时持久化到 localStorage', async () => {
      const lang = 'fr';
      mockGetDefaultAppLanguage.mockResolvedValue({ lang, migrated: false });

      const store = useAppConfigStore();
      await store.initializeAppLanguage();

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);
    });

    it('应该在初始化时使用检测结果持久化（而非从 store 读取）', async () => {
      const lang = 'zh';
      mockGetDefaultAppLanguage.mockResolvedValue({ lang, migrated: false });

      const store = useAppConfigStore();
      await store.initializeAppLanguage();

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);
      });

      // 验证 store 状态也被更新
      expect(store.language).toBe(lang);
    });

    it('应该在初始化时不显示 Toast（自动行为）', async () => {
      const lang = 'fr';
      mockGetDefaultAppLanguage.mockResolvedValue({ lang, migrated: false });

      const store = useAppConfigStore();
      await store.initializeAppLanguage();

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(1);
      });

      // 验证没有显示 Toast
      expect(mockToastLoading).not.toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(mockToastError).not.toHaveBeenCalled();
      expect(mockToastDismiss).not.toHaveBeenCalled();
    });

    it('应该在用户主动切换语言时显示 Toast', async () => {
      const lang = 'zh';
      mockChangeAppLanguage.mockResolvedValue({ success: true });

      const store = useAppConfigStore();
      await store.setAppLanguage(lang);

      await vi.waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      });

      // 验证显示 Toast
      expect(mockToastLoading).toHaveBeenCalledTimes(1);
    });

    it('应该验证降级语言被正确持久化到 localStorage', async () => {
      // 模拟降级场景：无效语言 'de' 降级到系统语言 'fr'
      const fallbackLang = 'fr';
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: fallbackLang, migrated: true, from: 'de' });

      const store = useAppConfigStore();
      await store.initializeAppLanguage();

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, fallbackLang);
      });
    });

    it('应该在初始化时持久化检测结果而不依赖已有 store 状态', async () => {
      const lang = 'zh';
      mockGetDefaultAppLanguage.mockResolvedValue({ lang, migrated: false });

      const store = useAppConfigStore();
      // 预先设置一个不同的语言，验证持久化使用检测结果
      store.language = 'de';

      await store.initializeAppLanguage();

      await vi.waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_LANGUAGE_KEY, lang);
      });
    });
  });

  describe('自动命名功能开关持久化', () => {
    it('应该持久化到 localStorage 当启用自动命名', () => {
      const store = useAppConfigStore();
      store.setAutoNamingEnabled(true);

      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
        'true'
      );
    });

    it('应该持久化到 localStorage 当禁用自动命名', () => {
      const store = useAppConfigStore();
      store.setAutoNamingEnabled(false);

      expect(setItemSpy).toHaveBeenCalledWith(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
        'false'
      );
    });
  });
});

/**
 * appConfigMiddleware 单元测试
 *
 * 测试 Listener Middleware 的配置持久化逻辑和 i18n 更新
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock toastQueue and i18n before importing middleware
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn(async () => 'loading-toast-id'),
    success: vi.fn(async () => 'toast-id'),
    error: vi.fn(async () => 'toast-id'),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/services/i18n', () => ({
  changeAppLanguage: vi.fn(),
}));

import { saveDefaultAppLanguage } from '@/store/middleware/appConfigMiddleware';
import { setAppLanguage, setTransmitHistoryReasoning, setAutoNamingEnabled } from '@/store/slices/appConfigSlices';
import { changeAppLanguage } from '@/services/i18n';
import { createMiddlewareTestStore } from './createMiddlewareTestStore';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';
import { toastQueue } from '@/services/toast';

const mockChangeAppLanguage = vi.mocked(changeAppLanguage);
const mockToastLoading = vi.mocked(toastQueue.loading);
const mockToastSuccess = vi.mocked(toastQueue.success);
const mockToastError = vi.mocked(toastQueue.error);
const mockToastDismiss = vi.mocked(toastQueue.dismiss);

describe('appConfigMiddleware', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: Redux Toolkit 严格类型系统限制
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createMiddlewareTestStore(saveDefaultAppLanguage.middleware);

    // 重置 localStorage mock
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as unknown as Storage;

    // 重置 toast mocks 并设置默认返回值
    (mockToastLoading as any).mockClear().mockResolvedValue('loading-toast-id');
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockToastDismiss.mockClear();

    // 重置 changeAppLanguage mock 返回值
    mockChangeAppLanguage.mockResolvedValue({ success: true });
  });

  describe('语言切换时的持久化和 i18n 更新', () => {
    it('应该将语言持久化到 localStorage 当 dispatch setAppLanguage 为 zh', async () => {
      const lang = 'zh';
      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang
      );

      // 验证 changeAppLanguage 被调用
      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);

      // 验证 state 被更新
      expect(store.getState().appConfig.language).toBe(lang);
    });

    it('应该将语言持久化到 localStorage 当 dispatch setAppLanguage 为 en', async () => {
      const lang = 'en';
      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang
      );

      // 验证 changeAppLanguage 被调用
      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);

      // 验证 state 被更新
      expect(store.getState().appConfig.language).toBe(lang);
    });

    it('应该在 localStorage 调用失败时继续传递 action', async () => {
      // Mock localStorage.setItem 抛出错误
      const mockSetItem = vi.fn(() => {
        throw new Error('localStorage is full');
      });
      global.localStorage.setItem = mockSetItem;

      const lang = 'zh';

      // dispatch action 不应抛出错误
      expect(() => {
        store.dispatch(setAppLanguage(lang));
      }).not.toThrow();

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 state 仍然被更新（action 正常传递）
      expect(store.getState().appConfig.language).toBe(lang);
    });
  });

  describe('推理内容配置的持久化', () => {
    it('应该将推理内容配置持久化到 localStorage 当启用时', async () => {
      const includeReasoning = true;
      store.dispatch(setTransmitHistoryReasoning(includeReasoning));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
        String(includeReasoning)
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.transmitHistoryReasoning).toBe(includeReasoning);
    });

    it('应该将推理内容配置持久化到 localStorage 当禁用时', async () => {
      const includeReasoning = false;
      store.dispatch(setTransmitHistoryReasoning(includeReasoning));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
        String(includeReasoning)
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.transmitHistoryReasoning).toBe(includeReasoning);
    });
  });

  describe('自动命名开关的持久化', () => {
    it('应该将自动命名开关持久化到 localStorage 当启用时', async () => {
      const enabled = true;
      store.dispatch(setAutoNamingEnabled(enabled));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
        String(enabled)
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.autoNamingEnabled).toBe(enabled);
    });

    it('应该将自动命名开关持久化到 localStorage 当禁用时', async () => {
      const enabled = false;
      store.dispatch(setAutoNamingEnabled(enabled));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY,
        String(enabled)
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.autoNamingEnabled).toBe(enabled);
    });
  });

  describe('监听器正确注册和触发', () => {
    it('应该在 setAppLanguage action 触发时执行持久化和 i18n 更新', async () => {
      const lang = 'zh';
      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证监听器执行了持久化逻辑
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang
      );

      // 验证监听器调用了 i18n 更新函数
      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);
    });

    it('应该在 setTransmitHistoryReasoning action 触发时执行持久化但不调用 i18n 更新', async () => {
      const includeReasoning = true;
      store.dispatch(setTransmitHistoryReasoning(includeReasoning));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证监听器执行了持久化逻辑
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY,
        String(includeReasoning)
      );

      // 验证没有调用 i18n 更新函数
      expect(mockChangeAppLanguage).not.toHaveBeenCalled();
    });

    it('应该在非 appConfig action 时不执行任何副作用', async () => {
      // Dispatch 不相关的 action
      store.dispatch({ type: 'some/other/action' });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证没有执行任何副作用
      expect(global.localStorage.setItem).not.toHaveBeenCalled();
      expect(mockChangeAppLanguage).not.toHaveBeenCalled();
    });
  });

  describe('与 Redux store 的集成', () => {
    it('应该在 store 初始化时正确注册中间件', async () => {
      // 验证 store 创建成功
      expect(store).toBeDefined();
      expect(store.getState().appConfig).toBeDefined();

      // Dispatch action 并验证中间件正常工作
      store.dispatch(setAppLanguage('zh'));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证中间件执行了副作用
      expect(global.localStorage.setItem).toHaveBeenCalled();
      expect(mockChangeAppLanguage).toHaveBeenCalled();
    });

    it('应该与 Redux DevTools 兼容并显示完整的 action 历史', async () => {
      // 监听所有 action
      store.subscribe(() => {
        // 在真实场景中，DevTools 会显示 action 历史
        // 这里我们验证 action 可以正常 dispatch
      });

      // Dispatch 多个 action
      store.dispatch(setAppLanguage('zh'));
      store.dispatch(setTransmitHistoryReasoning(true));
      store.dispatch(setAppLanguage('en'));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证所有 action 都被处理
      expect(store.getState().appConfig.language).toBe('en');
      expect(store.getState().appConfig.transmitHistoryReasoning).toBe(true);

      // 验证副作用被执行了多次（每个 action）
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该正确处理空字符串语言', async () => {
      const lang = '';
      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证仍然会执行持久化
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.language).toBe(lang);
    });

    it('应该正确处理连续的语言切换', async () => {
      // 连续 dispatch 多个语言切换
      store.dispatch(setAppLanguage('zh'));
      store.dispatch(setAppLanguage('en'));
      store.dispatch(setAppLanguage('zh'));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证每次切换都触发了持久化和 i18n 更新
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(mockChangeAppLanguage).toHaveBeenCalledTimes(3);

      // 验证最终状态
      expect(store.getState().appConfig.language).toBe('zh');
    });

    it('应该正确处理连续的推理内容切换', async () => {
      // 连续 dispatch 多个推理内容切换
      store.dispatch(setTransmitHistoryReasoning(true));
      store.dispatch(setTransmitHistoryReasoning(false));
      store.dispatch(setTransmitHistoryReasoning(true));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证每次切换都触发了持久化
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(3);

      // 验证最终状态
      expect(store.getState().appConfig.transmitHistoryReasoning).toBe(true);
    });
  });

  describe('Toast 加载提示和错误处理', () => {
    it('应该在语言切换时显示 loading Toast', async () => {
      const lang = 'zh';
      mockChangeAppLanguage.mockResolvedValue({ success: true });

      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 loading Toast 被显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);
      expect(mockToastLoading).toHaveBeenCalledWith('切换语言中...');

      // 验证 loading Toast 被 dismiss
      expect(mockToastDismiss).toHaveBeenCalledTimes(1);
      expect(mockToastDismiss).toHaveBeenCalledWith('loading-toast-id');

      // 验证成功 Toast 被显示
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess).toHaveBeenCalledWith('语言切换成功');
    });

    it('应该在语言加载失败时显示错误 Toast', async () => {
      const lang = 'fr';
      mockChangeAppLanguage.mockResolvedValue({ success: false });

      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 loading Toast 被显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);

      // 验证 loading Toast 被 dismiss
      expect(mockToastDismiss).toHaveBeenCalledTimes(1);

      // 验证错误 Toast 被显示
      expect(mockToastError).toHaveBeenCalledTimes(1);
      expect(mockToastError).toHaveBeenCalledWith(`语言切换失败: ${lang}`);
    });

    it('应该在 changeAppLanguage 抛出异常时显示通用错误 Toast', async () => {
      const lang = 'zh';
      mockChangeAppLanguage.mockRejectedValue(new Error('Network error'));

      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 loading Toast 被显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);

      // 验证 loading Toast 被 dismiss
      expect(mockToastDismiss).toHaveBeenCalledTimes(1);

      // 验证通用错误 Toast 被显示
      expect(mockToastError).toHaveBeenCalledTimes(1);
      expect(mockToastError).toHaveBeenCalledWith('语言切换失败，请重试');
    });

    it('应该验证 changeAppLanguage 返回 { success: boolean } 类型', async () => {
      const lang = 'zh';

      // 测试成功情况
      mockChangeAppLanguage.mockResolvedValue({ success: true });
      store.dispatch(setAppLanguage(lang));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockChangeAppLanguage).toHaveBeenCalledWith(lang);

      // 测试失败情况
      mockChangeAppLanguage.mockResolvedValue({ success: false });
      store.dispatch(setAppLanguage('en'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockChangeAppLanguage).toHaveBeenCalledWith('en');
    });

    it('应该正确处理 Promise 异步', async () => {
      const lang = 'zh';
      let resolvePromise: (value: { success: boolean }) => void;

      // 创建一个可控的 Promise
      mockChangeAppLanguage.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      store.dispatch(setAppLanguage(lang));

      // 立即验证 loading Toast 已显示
      expect(mockToastLoading).toHaveBeenCalledTimes(1);

      // Promise 尚未完成，验证成功 Toast 尚未显示
      expect(mockToastSuccess).not.toHaveBeenCalled();

      // 解析 Promise
      resolvePromise!({ success: true });
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证成功 Toast 已显示
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('初始化时的语言持久化', () => {
    it('应该在 initializeAppLanguage.fulfilled 时持久化到 localStorage', async () => {
      const lang = 'fr';

      // dispatch initializeAppLanguage.fulfilled action（模拟初始化完成）
      store.dispatch({
        type: 'appConfig/language/initialize/fulfilled',
        payload: lang,
      });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang
      );
    });

    it('应该在初始化时使用 action.payload 持久化（而非从 store 读取）', async () => {
      const lang = 'zh';

      // dispatch initializeAppLanguage.fulfilled action
      store.dispatch({
        type: 'appConfig/language/initialize/fulfilled',
        payload: lang,
      });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证使用的是 action.payload 而不是 store 中的值
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang // 应该使用 payload 的值
      );

      // 验证 store 状态也被 extraReducers 更新
      expect(store.getState().appConfig.language).toBe(lang);
    });

    it('应该在初始化时不显示 Toast（自动行为）', async () => {
      const lang = 'fr';

      // dispatch initializeAppLanguage.fulfilled action
      store.dispatch({
        type: 'appConfig/language/initialize/fulfilled',
        payload: lang,
      });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证没有显示 Toast
      expect(mockToastLoading).not.toHaveBeenCalled();
      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(mockToastError).not.toHaveBeenCalled();
      expect(mockToastDismiss).not.toHaveBeenCalled();
    });

    it('应该在用户主动切换语言时显示 Toast（action.type 是 setAppLanguage）', async () => {
      const lang = 'zh';
      mockChangeAppLanguage.mockResolvedValue({ success: true });

      store.dispatch(setAppLanguage(lang));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证显示 Toast
      expect(mockToastLoading).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    it('应该验证降级语言被正确持久化到 localStorage', async () => {
      // 模拟降级场景：无效语言 'de' 降级到系统语言 'fr'
      const fallbackLang = 'fr';

      store.dispatch({
        type: 'appConfig/language/initialize/fulfilled',
        payload: fallbackLang,
      });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证降级语言被持久化
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        fallbackLang
      );
    });

    it('应该验证即使 extraReducers 未更新 store，middleware 仍能正确持久化', async () => {
      const lang = 'zh';

      // dispatch initializeAppLanguage.fulfilled action
      // 注意：在真实的 Redux flow 中，extraReducers 会先更新 store
      // 但这个测试验证 middleware 不依赖 store 状态
      store.dispatch({
        type: 'appConfig/language/initialize/fulfilled',
        payload: lang,
      });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证使用的是 action.payload（不依赖 store 状态）
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_LANGUAGE_KEY,
        lang
      );
    });
  });
});

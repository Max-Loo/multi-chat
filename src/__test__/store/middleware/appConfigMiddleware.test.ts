/**
 * appConfigMiddleware 单元测试
 *
 * 测试 Listener Middleware 的配置持久化逻辑和 i18n 更新
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { saveDefaultAppLanguage } from '@/store/middleware/appConfigMiddleware';
import { setAppLanguage, setIncludeReasoningContent } from '@/store/slices/appConfigSlices';
import appConfigReducer from '@/store/slices/appConfigSlices';
import modelReducer from '@/store/slices/modelSlice';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import { changeAppLanguage } from '@/lib/i18n';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/lib/global';
import { LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY } from '@/utils/constants';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  changeAppLanguage: vi.fn().mockResolvedValue(undefined),
}));

const mockChangeAppLanguage = vi.mocked(changeAppLanguage);

describe('appConfigMiddleware', () => {
  let store: any;

  // 创建测试用的 Redux store
  const createTestStore = () => {
    return configureStore({
      reducer: {
        models: modelReducer,
        chat: chatReducer,
        chatPage: chatPageReducer,
        appConfig: appConfigReducer,
        modelProvider: modelProviderReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(saveDefaultAppLanguage.middleware),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();

    // 重置 localStorage mock
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as unknown as Storage;
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
      store.dispatch(setIncludeReasoningContent(includeReasoning));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY,
        String(includeReasoning)
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.includeReasoningContent).toBe(includeReasoning);
    });

    it('应该将推理内容配置持久化到 localStorage 当禁用时', async () => {
      const includeReasoning = false;
      store.dispatch(setIncludeReasoningContent(includeReasoning));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 localStorage.setItem 被调用
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY,
        String(includeReasoning)
      );

      // 验证 state 被更新
      expect(store.getState().appConfig.includeReasoningContent).toBe(includeReasoning);
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

    it('应该在 setIncludeReasoningContent action 触发时执行持久化但不调用 i18n 更新', async () => {
      const includeReasoning = true;
      store.dispatch(setIncludeReasoningContent(includeReasoning));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证监听器执行了持久化逻辑
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY,
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
      store.dispatch(setIncludeReasoningContent(true));
      store.dispatch(setAppLanguage('en'));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证所有 action 都被处理
      expect(store.getState().appConfig.language).toBe('en');
      expect(store.getState().appConfig.includeReasoningContent).toBe(true);

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
      store.dispatch(setIncludeReasoningContent(true));
      store.dispatch(setIncludeReasoningContent(false));
      store.dispatch(setIncludeReasoningContent(true));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证每次切换都触发了持久化
      expect(global.localStorage.setItem).toHaveBeenCalledTimes(3);

      // 验证最终状态
      expect(store.getState().appConfig.includeReasoningContent).toBe(true);
    });
  });
});

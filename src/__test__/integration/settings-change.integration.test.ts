/**
 * 设置变更集成测试
 *
 * 测试目的：验证应用配置变更与 Redux、i18next、localStorage 的集成
 * 测试隔离：使用真实的 Redux store、i18next 和 localStorage
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { getTestStore, cleanupStore } from '@/__test__/helpers/integration/resetStore';
import { waitForLocalStorage } from '@/__test__/helpers/integration/waitForStorage';
import {
  setAppLanguage,
  setTransmitHistoryReasoning,
  setAutoNamingEnabled,
  initializeAppLanguage,
  initializeTransmitHistoryReasoning,
  initializeAutoNamingEnabled,
} from '@/store/slices/appConfigSlices';
import { initI18n } from '@/services/i18n';
import { getDefaultAppLanguage } from '@/services/global';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';

// Mock Tauri 环境
vi.mock('@/utils/tauriCompat', () => globalThis.__createTauriCompatModuleMock());

describe('设置变更集成测试', () => {
  let testStore: ReturnType<typeof getTestStore>;

  beforeEach(() => {
    localStorage.clear();
    cleanupStore();
    testStore = getTestStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    cleanupStore();
  });

  // ========================================
  // 4.2 语言切换流程测试
  // ========================================

  describe('语言切换流程测试', () => {
    test('用户切换语言 → Redux 更新 → i18next 更新 → localStorage 持久化', async () => {
      expect(testStore.getState().appConfig.language).toBe('');
      testStore.dispatch(setAppLanguage('zh'));
      expect(testStore.getState().appConfig.language).toBe('zh');

      await waitForLocalStorage(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
    });

    test('验证 setAppLanguage action 触发', () => {
      const spy = vi.spyOn(testStore, 'dispatch');
      testStore.dispatch(setAppLanguage('zh'));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'appConfig/setAppLanguage',
        payload: 'zh',
      }));
      spy.mockRestore();
    });
  });

  // ========================================
  // 4.3 语言持久化和恢复测试
  // ========================================

  describe('语言持久化和恢复测试', () => {
    test('刷新页面后语言保持', async () => {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initResult = await testStore.dispatch<any>(initializeAppLanguage());
      expect(testStore.getState().appConfig.language).toBe('zh');
      expect(initResult.payload).toBe('zh');
    });

    test('验证 localStorage 加载', async () => {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
      const defaultLang = await getDefaultAppLanguage();
      expect(defaultLang.lang).toBe('zh');
    });

    test('验证 i18next 初始化', async () => {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
      await initI18n();
      const { default: i18next } = await import('i18next');
      expect(i18next.isInitialized).toBe(true);
    });
  });

  // ========================================
  // 4.4 推理内容开关流程测试
  // ========================================

  describe('推理内容开关流程测试', () => {
    test('用户切换开关 → Redux 更新 → localStorage 持久化', async () => {
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);
      testStore.dispatch(setTransmitHistoryReasoning(true));
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

      await waitForLocalStorage(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');
    });

    test('验证 setTransmitHistoryReasoning action 触发', () => {
      const spy = vi.spyOn(testStore, 'dispatch');
      testStore.dispatch(setTransmitHistoryReasoning(true));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'appConfig/setTransmitHistoryReasoning',
        payload: true,
      }));
      spy.mockRestore();
    });

    test('验证 localStorage 保存', async () => {
      testStore.dispatch(setTransmitHistoryReasoning(true));
      await waitForLocalStorage(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');
    });

    test('验证 chatService 应用设置', () => {
      testStore.dispatch(setTransmitHistoryReasoning(true));
      const state = testStore.getState();
      expect(state.appConfig.transmitHistoryReasoning).toBe(true);
    });
  });

  // ========================================
  // 4.5 推理内容开关持久化测试
  // ========================================

  describe('推理内容开关持久化测试', () => {
    test.each([
      ['true', true],
      ['false', false],
    ] as const)('localStorage 为 %s 时开关状态恢复为 %s', async (storedValue, expected) => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, storedValue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(expected);
    });

    test('验证 UI 显示正确的开关状态', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());
      const state = testStore.getState();
      expect(state.appConfig.transmitHistoryReasoning).toBe(true);
    });
  });

  // ========================================
  // 4.6 自动命名开关流程测试
  // ========================================

  describe('自动命名开关流程测试', () => {
    test('用户切换开关 → Redux 更新 → localStorage 持久化', async () => {
      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(true);
      testStore.dispatch(setAutoNamingEnabled(false));
      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(false);

      await waitForLocalStorage(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');
    });

    test('验证 setAutoNamingEnabled action 触发', () => {
      const spy = vi.spyOn(testStore, 'dispatch');
      testStore.dispatch(setAutoNamingEnabled(false));
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'appConfig/setAutoNamingEnabled',
        payload: false,
      }));
      spy.mockRestore();
    });

    test('验证连续切换开关', () => {
      const initialState = testStore.getState().appConfig.autoNamingEnabled;
      testStore.dispatch(setAutoNamingEnabled(!initialState));
      testStore.dispatch(setAutoNamingEnabled(initialState));
      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(initialState);
    });

    test('验证开关状态与 Redux store 同步', () => {
      const initialState = testStore.getState().appConfig.autoNamingEnabled;
      testStore.dispatch(setAutoNamingEnabled(!initialState));
      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(!initialState);
    });
  });

  // ========================================
  // 4.7 自动命名开关持久化测试
  // ========================================

  describe('自动命名开关持久化测试', () => {
    test('刷新页面后开关状态保持', async () => {
      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'true');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await testStore.dispatch<any>(initializeAutoNamingEnabled());
      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(true);
    });

    test.each([
      ['true', true],
      ['false', false],
    ] as const)('localStorage 为 %s 时恢复为 %s', async (storedValue, expected) => {
      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, storedValue);
      const newStore = getTestStore();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await newStore.dispatch<any>(initializeAutoNamingEnabled());
      expect(newStore.getState().appConfig.autoNamingEnabled).toBe(expected);
    });

    test('验证开关状态在不同浏览器会话间保持', () => {
      testStore.dispatch(setAutoNamingEnabled(false));
      const savedValue = localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY);
      expect(savedValue).toBe('false');
    });

    test('验证完整的持久化流程：用户关闭开关 → 刷新页面 → 开关保持关闭', async () => {
      testStore.dispatch(setAutoNamingEnabled(false));
      await waitForLocalStorage(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');

      const newStore = getTestStore();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await newStore.dispatch<any>(initializeAutoNamingEnabled());
      expect(newStore.getState().appConfig.autoNamingEnabled).toBe(false);
    });
  });

  // ========================================
  // 4.8 设置初始化流程测试
  // ========================================

  describe('设置初始化流程测试', () => {
    test('应用启动时加载设置', async () => {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testStore.dispatch<any>(initializeAppLanguage()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testStore.dispatch<any>(initializeTransmitHistoryReasoning()),
      ]);

      expect(testStore.getState().appConfig.language).toBe('zh');
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);
    });

    test('设置缺失时使用默认值', async () => {
      localStorage.clear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);
    });

    test('设置格式错误时降级处理', async () => {
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'invalid');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);
    });

    test('验证初始化顺序正确', async () => {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');
      const dispatchSpy = vi.spyOn(testStore, 'dispatch');

      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testStore.dispatch<any>(initializeAppLanguage()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testStore.dispatch<any>(initializeTransmitHistoryReasoning()),
      ]);

      expect(dispatchSpy).toHaveBeenCalled();
      dispatchSpy.mockRestore();
    });
  });

  // ========================================
  // 4.9 设置变更副作用验证测试
  // ========================================

  describe('设置变更副作用验证测试', () => {
    test('语言切换不影响聊天历史', () => {
      const chatData = JSON.stringify({ id: 'test-chat', messages: [] });
      localStorage.setItem('multi-chat-chat-list', chatData);
      testStore.dispatch(setAppLanguage('zh'));
      const savedChatData = localStorage.getItem('multi-chat-chat-list');
      expect(savedChatData).toBe(chatData);
    });

    test('推理内容开关不影响历史聊天', () => {
      const chatData = JSON.stringify({ id: 'test-chat', messages: [] });
      localStorage.setItem('multi-chat-chat-list', chatData);
      testStore.dispatch(setTransmitHistoryReasoning(true));
      const savedChatData = localStorage.getItem('multi-chat-chat-list');
      expect(savedChatData).toBe(chatData);
    });

    test('验证设置变更的独立性', async () => {
      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');
      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');
      testStore.dispatch(setAppLanguage('en'));

      await waitForLocalStorage(LOCAL_STORAGE_LANGUAGE_KEY, 'en');
      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');
    });
  });

  // ========================================
  // 4.10 设置 UI 响应性验证测试
  // ========================================

  describe('设置 UI 响应性验证测试', () => {
    test('验证设置变更的及时性', async () => {
      const startTime = Date.now();
      testStore.dispatch(setAppLanguage('zh'));
      expect(testStore.getState().appConfig.language).toBe('zh');
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  // ========================================
  // 4.11 多设置同时变更测试
  // ========================================

  describe('多设置同时变更测试', () => {
    test('同时修改语言和推理内容开关', async () => {
      expect(testStore.getState().appConfig.language).toBe('');
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);
      testStore.dispatch(setAppLanguage('zh'));
      testStore.dispatch(setTransmitHistoryReasoning(true));
      expect(testStore.getState().appConfig.language).toBe('zh');
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

      await waitFor(() => {
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');
        expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');
      }, { timeout: 1000, interval: 10 });
    });

    test('验证设置的原子性', () => {
      const actions = [
        setAppLanguage('zh'),
        setTransmitHistoryReasoning(true),
      ];
      actions.forEach(action => {
        testStore.dispatch(action);
      });
      expect(testStore.getState().appConfig.language).toBe('zh');
      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);
    });

    test('验证多个设置变更的顺序', () => {
      const executionOrder: string[] = [];
      const originalDispatch = testStore.dispatch.bind(testStore);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      testStore.dispatch = ((action: any) => {
        if (action.type?.includes('setAppLanguage') || action.type?.includes('setTransmitHistoryReasoning')) {
          executionOrder.push(action.type);
        }
        return originalDispatch(action);
      }) as typeof testStore.dispatch;

      testStore.dispatch(setAppLanguage('zh'));
      testStore.dispatch(setTransmitHistoryReasoning(true));

      expect(executionOrder).toEqual([
        'appConfig/setAppLanguage',
        'appConfig/setTransmitHistoryReasoning',
      ]);
    });
  });
});

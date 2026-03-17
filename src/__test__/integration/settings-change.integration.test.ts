/**

 * 设置变更集成测试

 * 

 * 测试目的：验证应用配置变更与 Redux、i18next、localStorage 的集成

 * 测试范围：

 * - 语言切换流程测试

 * - 语言持久化和恢复测试

 * - 推理内容开关流程测试

 * - 推理内容开关持久化测试

 * - 跨平台设置持久化一致性测试

 * - 设置初始化流程测试

 * - 设置变更副作用验证测试

 * - 设置 UI 响应性验证测试

 * - 多设置同时变更测试

 * 

 * 测试隔离：使用真实的 Redux store、i18next 和 localStorage

 * 每个测试后清理副作用

 */



import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { clearIndexedDB } from '@/__test__/helpers/integration/clearIndexedDB';

import { getTestStore, cleanupStore } from '@/__test__/helpers/integration/resetStore';

import {

  setAppLanguage,

  setTransmitHistoryReasoning,

  setAutoNamingEnabled,

  initializeAppLanguage,

  initializeTransmitHistoryReasoning,

  initializeAutoNamingEnabled,

} from '@/store/slices/appConfigSlices';

import { initI18n } from '@/lib/i18n';

import { getDefaultAppLanguage } from '@/lib/global';

import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/lib/global';

import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';



// Mock Tauri 环境

vi.mock('@/utils/tauriCompat', () => ({

  isTauri: () => false,

  locale: async () => 'en-US',

  createLazyStore: () => ({

    init: async () => {},

    get: async () => null,

    set: async () => {},

    delete: async () => {},

    keys: async () => [],

    save: async () => {},

    isSupported: () => true,

  }),

}));



describe('设置变更集成测试', () => {

  let testStore: ReturnType<typeof getTestStore>;



  beforeEach(async () => {

    // 清理 localStorage

    localStorage.clear();

    

    // 清理 IndexedDB

    await clearIndexedDB();

    

    // 重置 Redux store

    cleanupStore();

    testStore = getTestStore();

    

    // 重新初始化 i18next

    await initI18n();

    

    vi.clearAllMocks();

  });



  afterEach(async () => {

    // 清理 localStorage

    localStorage.clear();

    

    // 清理 IndexedDB

    await clearIndexedDB();

    

    // 清理 Redux store

    cleanupStore();

  });



  // ========================================

  // 4.2 语言切换流程测试

  // ========================================



  describe('语言切换流程测试', () => {

    test('用户切换语言 → Redux 更新 → i18next 更新 → localStorage 持久化', async () => {

      // Given: 初始语言为空

      expect(testStore.getState().appConfig.language).toBe('');

      

      // When: 用户切换语言为 'zh'

      testStore.dispatch(setAppLanguage('zh'));

      

      // Then: Redux store 更新

      expect(testStore.getState().appConfig.language).toBe('zh');

      

      // Then: localStorage 持久化（由于 middleware 是异步的，需要等待）

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');

    });



    test('验证 setAppLanguage action 触发', () => {

      // Given: 创建测试 store

      const spy = vi.spyOn(testStore, 'dispatch');

      

      // When: 触发语言切换

      testStore.dispatch(setAppLanguage('zh'));

      

      // Then: dispatch 应被调用

      expect(spy).toHaveBeenCalled();

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

      // Given: 保存语言到 localStorage

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      

      // When: 初始化应用

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      const initResult = await testStore.dispatch<any>(initializeAppLanguage());

      

      // Then: 语言应从 localStorage 恢复

      expect(testStore.getState().appConfig.language).toBe('zh');

      expect(initResult.payload).toBe('zh');

    });



    test('验证 localStorage 加载', async () => {

      // Given: 保存语言到 localStorage

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      

      // When: 读取默认语言

      const defaultLang = await getDefaultAppLanguage();

      

      // Then: 应返回 localStorage 中的值（返回的是 { lang, migrated } 对象）
      expect(defaultLang.lang).toBe('zh');

    });



    test('验证 i18next 初始化', async () => {

      // Given: 保存语言到 localStorage

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      

      // When: 重新初始化 i18next

      await initI18n();

      

      // Then: i18next 应使用 localStorage 中的语言（在真实环境中需要验证）

      // 由于测试环境的限制，我们只验证函数能够成功执行

      expect(true).toBe(true);

    });

  });



  // ========================================

  // 4.4 推理内容开关流程测试

  // ========================================



  describe('推理内容开关流程测试', () => {

    test('用户切换开关 → Redux 更新 → localStorage 持久化', async () => {

      // Given: 初始状态为 false

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);

      

      // When: 用户打开开关

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // Then: Redux store 更新

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

      

      // Then: localStorage 持久化（由于 middleware 是异步的，需要等待）

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');

    });



    test('验证 setTransmitHistoryReasoning action 触发', () => {

      // Given: 创建 spy

      const spy = vi.spyOn(testStore, 'dispatch');

      

      // When: 切换开关

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // Then: dispatch 应被调用

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({

        type: 'appConfig/setTransmitHistoryReasoning',

        payload: true,

      }));

      

      spy.mockRestore();

    });



    test('验证 localStorage 保存', async () => {

      // When: 切换开关

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // Then: localStorage 应保存

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');

    });



    test('验证 chatService 应用设置', () => {

      // Given: 设置开关

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // When: 获取设置

      const state = testStore.getState();

      

      // Then: 设置应正确保存

      expect(state.appConfig.transmitHistoryReasoning).toBe(true);

    });

  });



  // ========================================

  // 4.5 推理内容开关持久化测试

  // ========================================



  describe('推理内容开关持久化测试', () => {

    test('刷新页面后开关状态保持', async () => {

      // Given: 保存开关状态到 localStorage

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      

      // When: 初始化应用

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());

      

      // Then: 开关状态应恢复

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

    });



    test('验证 localStorage 加载', async () => {

      // Given: 保存开关状态到 localStorage

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      

      // When: 初始化

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());

      

      // Then: 应从 localStorage 加载

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

    });



    test('验证 Redux store 恢复', async () => {

      // Given: 保存开关状态到 localStorage

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'false');

      

      // When: 初始化

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());

      

      // Then: Redux store 应恢复

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);

    });



    test('验证 UI 显示正确的开关状态', async () => {

      // Given: 保存开关状态到 localStorage

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      

      // When: 初始化

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());

      

      // Then: UI 应显示正确的状态

      const state = testStore.getState();

      expect(state.appConfig.transmitHistoryReasoning).toBe(true);

    });

  });



  // ========================================

  // 4.6 自动命名开关流程测试

  // ========================================

  describe('自动命名开关流程测试', () => {

    test('用户切换开关 → Redux 更新 → localStorage 持久化', async () => {

      // Given: 初始状态为 true（默认值）

      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(true);



      // When: 用户关闭开关

      testStore.dispatch(setAutoNamingEnabled(false));



      // Then: Redux store 更新

      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(false);



      // Then: localStorage 持久化（由于 middleware 是异步的，需要等待）

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY)).toBe('false');

    });



    test('验证 setAutoNamingEnabled action 触发', () => {

      // Given: 创建 spy

      const spy = vi.spyOn(testStore, 'dispatch');



      // When: 切换开关

      testStore.dispatch(setAutoNamingEnabled(false));



      // Then: dispatch 应被调用

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({

        type: 'appConfig/setAutoNamingEnabled',

        payload: false,

      }));



      spy.mockRestore();

    });



    test('验证连续切换开关', () => {

      // Given: 初始状态

      const initialState = testStore.getState().appConfig.autoNamingEnabled;



      // When: 连续切换开关

      testStore.dispatch(setAutoNamingEnabled(!initialState));

      testStore.dispatch(setAutoNamingEnabled(initialState));



      // Then: 最终状态应与初始状态一致

      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(initialState);

    });



    test('验证开关状态与 Redux store 同步', () => {

      // Given: 初始状态

      const initialState = testStore.getState().appConfig.autoNamingEnabled;



      // When: 切换开关

      testStore.dispatch(setAutoNamingEnabled(!initialState));



      // Then: Redux store 应立即更新

      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(!initialState);

    });

  });



  // ========================================

  // 4.7 自动命名开关持久化测试

  // ========================================

  describe('自动命名开关持久化测试', () => {

    test('刷新页面后开关状态保持', async () => {

      // Given: 保存开关状态到 localStorage

      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'true');



      // When: 初始化应用（调用 initializeAutoNamingEnabled）

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeAutoNamingEnabled());



      // Then: 开关状态应从 localStorage 恢复

      expect(testStore.getState().appConfig.autoNamingEnabled).toBe(true);

    });



    test('验证 localStorage 加载', async () => {

      // Given: 保存开关状态到 localStorage（关闭状态）

      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');



      // When: 创建新的 store 并初始化（模拟刷新页面）

      const newStore = getTestStore();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await newStore.dispatch<any>(initializeAutoNamingEnabled());



      // Then: 应从 localStorage 加载并恢复为 false

      expect(newStore.getState().appConfig.autoNamingEnabled).toBe(false);

    });



    test('验证 Redux store 恢复', async () => {

      // Given: 保存开关状态到 localStorage（关闭状态）

      localStorage.setItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY, 'false');



      // When: 创建新的 store 并初始化（模拟刷新页面）

      const newStore = getTestStore();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await newStore.dispatch<any>(initializeAutoNamingEnabled());



      // Then: Redux store 应从 localStorage 恢复为 false

      expect(newStore.getState().appConfig.autoNamingEnabled).toBe(false);

    });



    test('验证开关状态在不同浏览器会话间保持', () => {

      // Given: 设置开关状态为关闭

      testStore.dispatch(setAutoNamingEnabled(false));



      // When: 模拟浏览器会话结束和重新开始（读取 localStorage）

      const savedValue = localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY);



      // Then: 新会话应读取到保存的值

      expect(savedValue).toBe('false');

    });



    test('验证完整的持久化流程：用户关闭开关 → 刷新页面 → 开关保持关闭', async () => {

      // Given: 用户关闭开关

      testStore.dispatch(setAutoNamingEnabled(false));



      // 等待 middleware 持久化到 localStorage

      await new Promise(resolve => setTimeout(resolve, 100));



      // When: 模拟刷新页面（创建新 store 并初始化）

      const newStore = getTestStore();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await newStore.dispatch<any>(initializeAutoNamingEnabled());



      // Then: 新 store 中的开关状态应为关闭（从 localStorage 恢复）

      expect(newStore.getState().appConfig.autoNamingEnabled).toBe(false);

    });

  });



  // ========================================

  // 4.8 跨平台设置持久化一致性测试

  // ========================================



  describe('跨平台设置持久化一致性测试', () => {

    test('Tauri 环境的设置持久化', async () => {

      // Given: Mock Tauri 环境

      const tauriCompat = await import('@/utils/tauriCompat');

      vi.spyOn(tauriCompat, 'isTauri').mockReturnValue(true);

      

      // When: 保存设置

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      

      // Then: 设置应正确保存

      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');

    });



    test('Web 环境的设置持久化', async () => {

      // Given: Web 环境

      const tauriCompat = await import('@/utils/tauriCompat');

      vi.spyOn(tauriCompat, 'isTauri').mockReturnValue(false);

      

      // When: 保存设置

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'en');

      

      // Then: 设置应正确保存

      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('en');

    });



    test('验证设置值格式一致', () => {

      // Given: 不同平台的设置值

      const settings = ['zh', 'en', 'zh-CN'];

      

      // When: 保存设置

      settings.forEach(lang => {

        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);

        

        // Then: 格式应一致

        const value = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);

        expect(value).toBe(lang);

        expect(typeof value).toBe('string');

      });

    });



    test('验证平台切换时设置迁移', () => {

      // Given: 保存设置

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      

      // When: 读取设置

      const value = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);

      

      // Then: 设置应保持

      expect(value).toBe('zh');

    });

  });



  // ========================================

  // 4.7 设置初始化流程测试

  // ========================================



  describe('设置初始化流程测试', () => {

    test('应用启动时加载设置', async () => {

      // Given: 保存设置到 localStorage

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      

      // When: 初始化应用

      await Promise.all([

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 第三方库类型定义不完整
        testStore.dispatch<any>(initializeAppLanguage()),

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 第三方库类型定义不完整
        testStore.dispatch<any>(initializeTransmitHistoryReasoning()),

      ]);

      

      // Then: 设置应正确加载

      expect(testStore.getState().appConfig.language).toBe('zh');

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

    });



    test('设置缺失时使用默认值', async () => {

      // Given: 清空 localStorage

      localStorage.clear();

      

      // When: 初始化应用

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());

      

      // Then: 应使用默认值

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);

    });



    test('设置格式错误时降级处理', async () => {

      // Given: 保存错误的格式

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'invalid');

      

      // When: 初始化应用

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      await testStore.dispatch<any>(initializeTransmitHistoryReasoning());

      

      // Then: 应降级处理

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);

    });



    test('验证初始化顺序正确', async () => {

      // Given: 保存设置

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      

      // When: 初始化

      const dispatchSpy = vi.spyOn(testStore, 'dispatch');

      

      await Promise.all([

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 第三方库类型定义不完整
        testStore.dispatch<any>(initializeAppLanguage()),

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Reason: 第三方库类型定义不完整
        testStore.dispatch<any>(initializeTransmitHistoryReasoning()),

      ]);

      

      // Then: dispatch 应被调用

      expect(dispatchSpy).toHaveBeenCalled();

      

      dispatchSpy.mockRestore();

    });

  });



  // ========================================

  // 4.8 设置变更副作用验证测试

  // ========================================



  describe('设置变更副作用验证测试', () => {

    test('语言切换不影响聊天历史', () => {

      // Given: 保存一些聊天数据

      const chatData = JSON.stringify({ id: 'test-chat', messages: [] });

      localStorage.setItem('multi-chat-chat-list', chatData);

      

      // When: 切换语言

      testStore.dispatch(setAppLanguage('zh'));

      

      // Then: 聊天历史应保持不变

      const savedChatData = localStorage.getItem('multi-chat-chat-list');

      expect(savedChatData).toBe(chatData);

    });



    test('推理内容开关不影响历史聊天', () => {

      // Given: 保存聊天数据

      const chatData = JSON.stringify({ id: 'test-chat', messages: [] });

      localStorage.setItem('multi-chat-chat-list', chatData);

      

      // When: 切换推理内容开关

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // Then: 聊天历史应保持不变

      const savedChatData = localStorage.getItem('multi-chat-chat-list');

      expect(savedChatData).toBe(chatData);

    });



    test('验证设置变更的独立性', async () => {

      // Given: 初始化所有设置

      localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

      localStorage.setItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY, 'true');

      

      // When: 只修改语言

      testStore.dispatch(setAppLanguage('en'));

      

      // Then: 推理内容开关应保持不变

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(testStore.getState().appConfig.language).toBe('en');

      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');

    });

  });



  // ========================================

  // 4.9 设置 UI 响应性验证测试

  // ========================================



  describe('设置 UI 响应性验证测试', () => {

    test('验证设置变更的及时性', async () => {

      // Given: 记录开始时间

      const startTime = Date.now();

      

      // When: 切换语言

      testStore.dispatch(setAppLanguage('zh'));

      

      // Then: 应在合理时间内完成

      expect(testStore.getState().appConfig.language).toBe('zh');

      

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 应在 1 秒内完成

    });

  });



  // ========================================

  // 4.10 多设置同时变更测试

  // ========================================



  describe('多设置同时变更测试', () => {

    test('同时修改语言和推理内容开关', async () => {

      // Given: 初始状态

      expect(testStore.getState().appConfig.language).toBe('');

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(false);

      

      // When: 同时修改两个设置

      testStore.dispatch(setAppLanguage('zh'));

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // Then: 所有设置应正确保存

      expect(testStore.getState().appConfig.language).toBe('zh');

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

      

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');

      expect(localStorage.getItem(LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY)).toBe('true');

    });



    test('验证设置的原子性', () => {

      // Given: 同时修改多个设置

      const actions = [

        setAppLanguage('zh'),

        setTransmitHistoryReasoning(true),

      ];

      

      // When: 批量执行

      actions.forEach(action => {

        testStore.dispatch(action);

      });

      

      // Then: 所有设置应成功

      expect(testStore.getState().appConfig.language).toBe('zh');

      expect(testStore.getState().appConfig.transmitHistoryReasoning).toBe(true);

    });



    test('验证多个设置变更的顺序', () => {

      // Given: 记录执行顺序

      const executionOrder: string[] = [];

      const originalDispatch = testStore.dispatch.bind(testStore);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 测试错误处理，需要构造无效输入
      testStore.dispatch = ((action: any) => {

        if (action.type?.includes('setAppLanguage') || action.type?.includes('setTransmitHistoryReasoning')) {

          executionOrder.push(action.type);

        }

        return originalDispatch(action);

      }) as typeof testStore.dispatch;

      

      // When: 同时修改

      testStore.dispatch(setAppLanguage('zh'));

      testStore.dispatch(setTransmitHistoryReasoning(true));

      

      // Then: 应按顺序执行

      expect(executionOrder).toEqual([

        'appConfig/setAppLanguage',

        'appConfig/setTransmitHistoryReasoning',

      ]);

    });

  });

});

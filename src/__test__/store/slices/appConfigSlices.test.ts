/**
 * appConfigSlices 单元测试
 *
 * 测试应用配置管理、语言初始化、推理内容开关等核心功能
 *
 * 删除的冗余测试（已被集成测试覆盖）：
 * - setAppLanguage (1 test)：语言设置已被 settings-change.integration.test.ts 覆盖
 * - setIncludeReasoningContent (2 tests)：推理内容开关已被集成测试覆盖
 * - selectIncludeReasoningContent (1 test)：简单的 selector 测试已被集成测试覆盖
 * - localStorage 持久化 (2 tests)：序列化/反序列化已被集成测试覆盖
 * - 配置状态全局同步 (1 test)：状态同步已被集成测试覆盖
 *
 * 保留的关键测试：
 * - localStorage 边缘情况：无值、错误值、格式错误
 * - 错误处理：rejected 状态
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY } from '@/utils/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock 依赖 - 必须在导入 slice 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const { mockGetDefaultAppLanguage } = vi.hoisted(() => {
  return {
    mockGetDefaultAppLanguage: vi.fn(),
  };
});

vi.mock('@/services/global', () => ({
  getDefaultAppLanguage: mockGetDefaultAppLanguage,
}));

import { configureStore } from '@reduxjs/toolkit';
import appConfigReducer, {
  initializeTransmitHistoryReasoning,
  setAutoNamingEnabled,
  selectAutoNamingEnabled,
} from '@/store/slices/appConfigSlices';

describe('appConfigSlices', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: Redux Toolkit 严格类型系统限制
  let store: any;

  // 创建测试用的 Redux store
  const createTestStore = () => {
    return configureStore({
      reducer: {
        appConfig: appConfigReducer,
      },
    });
  };

  beforeEach(() => {
    // 重置 mock 返回默认值
    mockGetDefaultAppLanguage.mockResolvedValue('en');
    localStorageMock.clear();
    store = createTestStore();
  });

  describe('initialState', () => {
    it('应该返回正确的初始状态', () => {
      const state = store.getState().appConfig;
      expect(state).toEqual({
        language: '',
        transmitHistoryReasoning: false,
        autoNamingEnabled: true,
      });
    });
  });

  describe('initializeTransmitHistoryReasoning', () => {
    it('应该在 localStorage 存储值为 true 时返回 true', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      // Dispatch Thunk
      const result = await store.dispatch(initializeTransmitHistoryReasoning());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/transmitHistoryReasoning/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.transmitHistoryReasoning).toBe(true);
    });

    it('应该在 localStorage 存储值为 false 时返回 false', async () => {
      localStorageMock.getItem.mockReturnValue('false');

      // Dispatch Thunk
      const result = await store.dispatch(initializeTransmitHistoryReasoning());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/transmitHistoryReasoning/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.transmitHistoryReasoning).toBe(false);
    });

    it('应该在 localStorage 中无值时返回 false（默认值）', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      // Dispatch Thunk
      const result = await store.dispatch(initializeTransmitHistoryReasoning());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/transmitHistoryReasoning/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.transmitHistoryReasoning).toBe(false);
    });

    it('应该在 rejected 时传播错误', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Dispatch Thunk
      const result = await store.dispatch(initializeTransmitHistoryReasoning());

      // 验证 Thunk rejected
      expect(result.type).toBe('appConfig/transmitHistoryReasoning/initialize/rejected');
    });

    it('应该使用正确的 localStorage 键', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      await store.dispatch(initializeTransmitHistoryReasoning());

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY
      );
    });
  });

  describe('自动命名功能', () => {
    it('初始值应该为 true', () => {
      const state = store.getState().appConfig;
      expect(state.autoNamingEnabled).toBe(true);
    });

    it('应该支持设置自动命名开关为 false', () => {
      store.dispatch(setAutoNamingEnabled(false));

      const state = store.getState().appConfig;
      expect(state.autoNamingEnabled).toBe(false);
    });

    it('应该支持设置自动命名开关为 true', () => {
      // 先设置为 false
      store.dispatch(setAutoNamingEnabled(false));

      // 再设置为 true
      store.dispatch(setAutoNamingEnabled(true));

      const state = store.getState().appConfig;
      expect(state.autoNamingEnabled).toBe(true);
    });

    it('selectAutoNamingEnabled 应该返回正确的值', () => {
      store.dispatch(setAutoNamingEnabled(false));

      const result = selectAutoNamingEnabled(store.getState());
      expect(result).toBe(false);

      store.dispatch(setAutoNamingEnabled(true));

      const result2 = selectAutoNamingEnabled(store.getState());
      expect(result2).toBe(true);
    });
  });
});

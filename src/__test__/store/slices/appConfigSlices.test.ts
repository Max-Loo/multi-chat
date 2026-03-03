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
import { LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY } from '@/utils/constants';

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

vi.mock('@/lib/global', () => ({
  getDefaultAppLanguage: mockGetDefaultAppLanguage,
}));

import { configureStore } from '@reduxjs/toolkit';
import appConfigReducer, {
  initializeIncludeReasoningContent,
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
    vi.clearAllMocks();
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
        includeReasoningContent: false,
      });
    });
  });

  // initializeAppLanguage 状态转换测试已被删除：
  // - fulfilled/rejected 测试（2 个）：已被集成测试覆盖
  // - 这些测试验证 Redux Toolkit 自动生成的状态转换，属于内部实现
  // - 集成测试 settings-change.integration.test.ts 已覆盖语言设置行为

  describe('initializeIncludeReasoningContent', () => {
    it('应该在 localStorage 存储值为 true 时返回 true', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      // Dispatch Thunk
      const result = await store.dispatch(initializeIncludeReasoningContent());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/includeReasoningContent/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.includeReasoningContent).toBe(true);
    });

    it('应该在 localStorage 存储值为 false 时返回 false', async () => {
      localStorageMock.getItem.mockReturnValue('false');

      // Dispatch Thunk
      const result = await store.dispatch(initializeIncludeReasoningContent());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/includeReasoningContent/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.includeReasoningContent).toBe(false);
    });

    it('应该在 localStorage 中无值时返回 false（默认值）', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      // Dispatch Thunk
      const result = await store.dispatch(initializeIncludeReasoningContent());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/includeReasoningContent/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.includeReasoningContent).toBe(false);
    });

    it('应该在 rejected 时传播错误', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Dispatch Thunk
      const result = await store.dispatch(initializeIncludeReasoningContent());

      // 验证 Thunk rejected
      expect(result.type).toBe('appConfig/includeReasoningContent/initialize/rejected');
    });

    it('应该使用正确的 localStorage 键', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      await store.dispatch(initializeIncludeReasoningContent());

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY
      );
    });
  });

  // setAppLanguage 测试已被删除：已被 settings-change.integration.test.ts 覆盖

  // setIncludeReasoningContent 测试已被删除：已被 settings-change.integration.test.ts 覆盖

  // selectIncludeReasoningContent 测试已被删除：已被集成测试覆盖

  // localStorage 持久化测试已被删除：已被集成测试覆盖

  // 配置状态全局同步测试已被删除：已被集成测试覆盖
});

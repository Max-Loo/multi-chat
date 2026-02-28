/**
 * appConfigSlices 单元测试
 * 
 * 测试应用配置管理、语言初始化、推理内容开关等核心功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import appConfigReducer, {
  initializeAppLanguage,
  initializeIncludeReasoningContent,
  setAppLanguage,
  setIncludeReasoningContent,
  selectIncludeReasoningContent,
} from '@/store/slices/appConfigSlices';
import { getDefaultAppLanguage } from '@/lib/global';
import { LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY } from '@/utils/constants';

// Mock 依赖
vi.mock('@/lib/global', () => ({
  getDefaultAppLanguage: vi.fn(),
}));

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

const mockGetDefaultAppLanguage = vi.mocked(getDefaultAppLanguage);

describe('appConfigSlices', () => {
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

  describe('initializeAppLanguage', () => {
    it('应该在 fulfilled 时更新语言设置', async () => {
      const mockLanguage = 'zh-CN';
      mockGetDefaultAppLanguage.mockResolvedValue(mockLanguage);

      // Dispatch Thunk
      const result = await store.dispatch(initializeAppLanguage());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('appConfig/language/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().appConfig;
      expect(state.language).toBe(mockLanguage);
    });

    it('应该在 rejected 时传播错误', async () => {
      const errorMessage = 'Failed to initialize language';
      mockGetDefaultAppLanguage.mockRejectedValue(new Error(errorMessage));

      // Dispatch Thunk
      const result = await store.dispatch(initializeAppLanguage());

      // 验证 Thunk rejected
      expect(result.type).toBe('appConfig/language/initialize/rejected');
    });
  });

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

  describe('setAppLanguage', () => {
    it('应该更新语言设置', () => {
      const language = 'en-US';
      store.dispatch(setAppLanguage(language));

      const state = store.getState().appConfig;
      expect(state.language).toBe(language);
    });
  });

  describe('setIncludeReasoningContent', () => {
    it('应该更新推理内容开关为 true', () => {
      store.dispatch(setIncludeReasoningContent(true));

      const state = store.getState().appConfig;
      expect(state.includeReasoningContent).toBe(true);
    });

    it('应该更新推理内容开关为 false', () => {
      store.dispatch(setIncludeReasoningContent(true));
      expect(store.getState().appConfig.includeReasoningContent).toBe(true);

      store.dispatch(setIncludeReasoningContent(false));
      expect(store.getState().appConfig.includeReasoningContent).toBe(false);
    });
  });

  describe('selectIncludeReasoningContent', () => {
    it('应该返回当前的推理内容开关状态', () => {
      // 初始状态为 false
      expect(selectIncludeReasoningContent(store.getState())).toBe(false);

      // 更新为 true
      store.dispatch(setIncludeReasoningContent(true));
      expect(selectIncludeReasoningContent(store.getState())).toBe(true);

      // 更新为 false
      store.dispatch(setIncludeReasoningContent(false));
      expect(selectIncludeReasoningContent(store.getState())).toBe(false);
    });
  });

  describe('localStorage 持久化', () => {
    it('应该正确序列化布尔值为字符串', async () => {
      // 测试 true 序列化
      localStorageMock.getItem.mockReturnValueOnce('true');
      await store.dispatch(initializeIncludeReasoningContent());
      expect(store.getState().appConfig.includeReasoningContent).toBe(true);

      // 测试 false 序列化
      localStorageMock.getItem.mockReturnValueOnce('false');
      await store.dispatch(initializeIncludeReasoningContent());
      expect(store.getState().appConfig.includeReasoningContent).toBe(false);
    });

    it('应该正确反序列化字符串为布尔值', async () => {
      // 测试 'true' 反序列化
      localStorageMock.getItem.mockReturnValue('true');
      await store.dispatch(initializeIncludeReasoningContent());
      expect(store.getState().appConfig.includeReasoningContent).toBe(true);

      // 测试 'false' 反序列化
      store = createTestStore(); // 重置 store
      localStorageMock.getItem.mockReturnValue('false');
      await store.dispatch(initializeIncludeReasoningContent());
      expect(store.getState().appConfig.includeReasoningContent).toBe(false);
    });
  });

  describe('配置状态全局同步', () => {
    it('应该通过 selector 获取更新后的配置', () => {
      expect(selectIncludeReasoningContent(store.getState())).toBe(false);

      store.dispatch(setIncludeReasoningContent(true));
      expect(selectIncludeReasoningContent(store.getState())).toBe(true);

      store.dispatch(setIncludeReasoningContent(false));
      expect(selectIncludeReasoningContent(store.getState())).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import appConfigReducer, {
  setAppLanguage,
  initializeAppLanguage,
  AppConfigSliceState,
} from '@/store/slices/appConfigSlices';
import { createMockAppConfig } from '@/__tests__/fixtures/appConfig';

// Mock the getDefaultAppLanguage function
vi.mock('@/lib/global', () => ({
  getDefaultAppLanguage: vi.fn(),
}));

// Import the mocked function
import { getDefaultAppLanguage } from '@/lib/global';

describe('appConfigSlice', () => {
  const initialState: AppConfigSliceState = {
    language: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const result = appConfigReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });
  });

  describe('setAppLanguage', () => {
    it('应该设置应用语言', () => {
      const language = 'en';
      const result = appConfigReducer(initialState, setAppLanguage(language));
      expect(result.language).toBe(language);
    });

    it('应该处理空字符串语言', () => {
      const language = '';
      const result = appConfigReducer(initialState, setAppLanguage(language));
      expect(result.language).toBe(language);
    });

    it('应该处理特殊字符语言', () => {
      const language = 'zh-CN';
      const result = appConfigReducer(initialState, setAppLanguage(language));
      expect(result.language).toBe(language);
    });
  });

  describe('initializeAppLanguage', () => {
    it('应该处理初始化语言成功', async () => {
      vi.mocked(getDefaultAppLanguage).mockResolvedValue('en');

      const pendingAction = { type: initializeAppLanguage.pending.type };
      const fulfilledAction = {
        type: initializeAppLanguage.fulfilled.type,
        payload: 'en',
      };

      // 测试pending状态
      let result = appConfigReducer(initialState, pendingAction);
      expect(result.language).toBe(initialState.language);

      // 测试fulfilled状态
      result = appConfigReducer(result, fulfilledAction);
      expect(result.language).toBe('en');
    });

    it('应该处理初始化语言失败', async () => {
      vi.mocked(getDefaultAppLanguage).mockRejectedValue(new Error('Failed to load language'));

      const pendingAction = { type: initializeAppLanguage.pending.type };
      const rejectedAction = {
        type: initializeAppLanguage.rejected.type,
        error: { message: 'Failed to load language' },
      };

      // 测试pending状态
      let result = appConfigReducer(initialState, pendingAction);
      expect(result.language).toBe(initialState.language);

      // 测试rejected状态
      result = appConfigReducer(result, rejectedAction);
      expect(result.language).toBe(initialState.language);
    });
  });

  describe('状态不可变性', () => {
    it('应该保持状态不可变性', () => {
      const state = createMockAppConfig({ language: 'en' });
      const newState = appConfigReducer(state, setAppLanguage('zh'));

      expect(newState).not.toBe(state);
      expect(state.language).toBe('en');
      expect(newState.language).toBe('zh');
    });
  });

  describe('边界情况', () => {
    it('应该处理未知action类型', () => {
      const state = createMockAppConfig({ language: 'en' });
      const result = appConfigReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(state);
    });

    it('应该处理undefined payload', () => {
      const state = createMockAppConfig({ language: 'en' });
      const result = appConfigReducer(state, setAppLanguage(undefined as unknown as string));
      expect(result.language).toBeUndefined();
    });
  });

  describe('错误场景测试', () => {
    it('应该处理initializeAppLanguage的错误场景', () => {
      const errorMessage = 'Failed to initialize language';
      const rejectedAction = {
        type: initializeAppLanguage.rejected.type,
        error: { message: errorMessage },
      };

      const result = appConfigReducer(initialState, rejectedAction);

      // 语言应该保持不变
      expect(result.language).toBe(initialState.language);
    });

    it('应该处理initializeAppLanguage错误时没有错误消息的情况', () => {
      const rejectedAction = {
        type: initializeAppLanguage.rejected.type,
        error: {},
      };

      const result = appConfigReducer(initialState, rejectedAction);

      // 语言应该保持不变
      expect(result.language).toBe(initialState.language);
    });
  });
});
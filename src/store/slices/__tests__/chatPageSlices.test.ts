import { describe, it, expect, vi, beforeEach } from 'vitest';
import chatPageReducer, {
  setIsCollapsed,
  setIsShowChatPage,
  ChatPageSliceState,
} from '@/store/slices/chatPageSlices';

describe('chatPageSlice', () => {
  const initialState: ChatPageSliceState = {
    isSidebarCollapsed: false,
    isShowChatPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const result = chatPageReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });
  });

  describe('setIsCollapsed', () => {
    it('应该设置侧边栏折叠状态为true', () => {
      const result = chatPageReducer(initialState, setIsCollapsed(true));
      expect(result.isSidebarCollapsed).toBe(true);
      expect(result.isShowChatPage).toBe(false);
    });

    it('应该设置侧边栏折叠状态为false', () => {
      const stateWithCollapsed = {
        ...initialState,
        isSidebarCollapsed: true,
      };
      const result = chatPageReducer(stateWithCollapsed, setIsCollapsed(false));
      expect(result.isSidebarCollapsed).toBe(false);
    });

    it('应该保持状态不可变性', () => {
      const state = { ...initialState };
      const result = chatPageReducer(state, setIsCollapsed(true));

      expect(result).not.toBe(state);
      expect(state.isSidebarCollapsed).toBe(false);
      expect(result.isSidebarCollapsed).toBe(true);
    });
  });

  describe('setIsShowChatPage', () => {
    it('应该设置是否位于聊天页面为true', () => {
      const result = chatPageReducer(initialState, setIsShowChatPage(true));
      expect(result.isShowChatPage).toBe(true);
      expect(result.isSidebarCollapsed).toBe(false);
    });

    it('应该设置是否位于聊天页面为false', () => {
      const stateWithShowPage = {
        ...initialState,
        isShowChatPage: true,
      };
      const result = chatPageReducer(stateWithShowPage, setIsShowChatPage(false));
      expect(result.isShowChatPage).toBe(false);
    });

    it('应该保持状态不可变性', () => {
      const state = { ...initialState };
      const result = chatPageReducer(state, setIsShowChatPage(true));

      expect(result).not.toBe(state);
      expect(state.isShowChatPage).toBe(false);
      expect(result.isShowChatPage).toBe(true);
    });
  });

  describe('组合操作', () => {
    it('应该正确处理多个action的组合', () => {
      let result = chatPageReducer(initialState, setIsCollapsed(true));
      expect(result.isSidebarCollapsed).toBe(true);
      expect(result.isShowChatPage).toBe(false);

      result = chatPageReducer(result, setIsShowChatPage(true));
      expect(result.isSidebarCollapsed).toBe(true);
      expect(result.isShowChatPage).toBe(true);

      result = chatPageReducer(result, setIsCollapsed(false));
      expect(result.isSidebarCollapsed).toBe(false);
      expect(result.isShowChatPage).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理未知action类型', () => {
      const state = {
        ...initialState,
        isSidebarCollapsed: true,
        isShowChatPage: true,
      };
      const result = chatPageReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(state);
    });

    it('应该处理布尔值以外的值', () => {
      // TypeScript应该防止这种情况，但测试确保运行时行为
      const result1 = chatPageReducer(initialState, setIsCollapsed(1 as unknown as boolean));
      expect(result1.isSidebarCollapsed).toBe(1);

      const result2 = chatPageReducer(initialState, setIsShowChatPage('true' as unknown as boolean));
      expect(result2.isShowChatPage).toBe('true');
    });
  });
});
import { describe, it, expect } from 'vitest';
import chatPageSlice, {
  setIsCollapsed,
  setIsShowChatPage,
  toggleDrawer,
  setIsDrawerOpen,
} from '@/store/slices/chatPageSlices';
import type { ChatPageSliceState } from '@/store/slices/chatPageSlices';

describe('chatPageSlice', () => {
  const initialState: ChatPageSliceState = {
    isSidebarCollapsed: false,
    isShowChatPage: false,
    isDrawerOpen: false,
  };

  describe('初始状态测试', () => {
    it('应该返回初始状态 当没有action传入', () => {
      expect(chatPageSlice(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setIsCollapsed action 测试', () => {
    it('应该设置侧边栏折叠状态', () => {
      const state = chatPageSlice(initialState, setIsCollapsed(true));
      expect(state.isSidebarCollapsed).toBe(true);
    });

    it('应该设置侧边栏展开状态', () => {
      const state = chatPageSlice({ ...initialState, isSidebarCollapsed: true }, setIsCollapsed(false));
      expect(state.isSidebarCollapsed).toBe(false);
    });
  });

  describe('setIsShowChatPage action 测试', () => {
    it('应该设置显示聊天页面状态', () => {
      const state = chatPageSlice(initialState, setIsShowChatPage(true));
      expect(state.isShowChatPage).toBe(true);
    });

    it('应该设置不显示聊天页面状态', () => {
      const state = chatPageSlice({ ...initialState, isShowChatPage: true }, setIsShowChatPage(false));
      expect(state.isShowChatPage).toBe(false);
    });
  });

  describe('toggleDrawer action 测试', () => {
    it('应该翻转抽屉状态 从 false 到 true', () => {
      const state = chatPageSlice(initialState, toggleDrawer());
      expect(state.isDrawerOpen).toBe(true);
    });

    it('应该翻转抽屉状态 从 true 到 false', () => {
      const state = chatPageSlice({ ...initialState, isDrawerOpen: true }, toggleDrawer());
      expect(state.isDrawerOpen).toBe(false);
    });

    it('应该保持其他状态不变 当切换抽屉状态', () => {
      const state = chatPageSlice(
        {
          isSidebarCollapsed: true,
          isShowChatPage: true,
          isDrawerOpen: false,
        },
        toggleDrawer()
      );
      expect(state.isSidebarCollapsed).toBe(true);
      expect(state.isShowChatPage).toBe(true);
      expect(state.isDrawerOpen).toBe(true);
    });
  });

  describe('setIsDrawerOpen action 测试', () => {
    it('应该设置抽屉打开状态', () => {
      const state = chatPageSlice(initialState, setIsDrawerOpen(true));
      expect(state.isDrawerOpen).toBe(true);
    });

    it('应该设置抽屉关闭状态', () => {
      const state = chatPageSlice({ ...initialState, isDrawerOpen: true }, setIsDrawerOpen(false));
      expect(state.isDrawerOpen).toBe(false);
    });
  });

  describe('多个action组合测试', () => {
    it('应该正确处理多个状态变更', () => {
      let state = chatPageSlice(initialState, setIsCollapsed(true));
      state = chatPageSlice(state, setIsShowChatPage(true));
      state = chatPageSlice(state, setIsDrawerOpen(true));

      expect(state.isSidebarCollapsed).toBe(true);
      expect(state.isShowChatPage).toBe(true);
      expect(state.isDrawerOpen).toBe(true);
    });
  });
});

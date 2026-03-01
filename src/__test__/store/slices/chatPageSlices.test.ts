/**
 * chatPageSlices 单元测试
 * 
 * 测试聊天页面状态管理，包括侧边栏折叠状态和页面显示状态
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore, createAction } from '@reduxjs/toolkit';
import chatPageReducer, {
  setIsCollapsed,
  setIsShowChatPage,
  type ChatPageSliceState,
} from '@/store/slices/chatPageSlices';

describe('chatPageSlices', () => {
  const initialState: ChatPageSliceState = {
    isSidebarCollapsed: false,
    isShowChatPage: false,
  };

  describe('侧边栏折叠状态变更', () => {
    it('应该更新 isSidebarCollapsed 为 true 当 dispatch setIsCollapsed(true)', () => {
      const state = chatPageReducer(initialState, setIsCollapsed(true));
      expect(state.isSidebarCollapsed).toBe(true);
      expect(state.isShowChatPage).toBe(false);
    });

    it('应该更新 isSidebarCollapsed 为 false 当 dispatch setIsCollapsed(false)', () => {
      const modifiedState: ChatPageSliceState = {
        isSidebarCollapsed: true,
        isShowChatPage: false,
      };
      const state = chatPageReducer(modifiedState, setIsCollapsed(false));
      expect(state.isSidebarCollapsed).toBe(false);
      expect(state.isShowChatPage).toBe(false);
    });
  });

  describe('聊天页面显示状态变更', () => {
    it('应该更新 isShowChatPage 为 true 当 dispatch setIsShowChatPage(true)', () => {
      const state = chatPageReducer(initialState, setIsShowChatPage(true));
      expect(state.isShowChatPage).toBe(true);
      expect(state.isSidebarCollapsed).toBe(false);
    });

    it('应该更新 isShowChatPage 为 false 当 dispatch setIsShowChatPage(false)', () => {
      const modifiedState: ChatPageSliceState = {
        isSidebarCollapsed: false,
        isShowChatPage: true,
      };
      const state = chatPageReducer(modifiedState, setIsShowChatPage(false));
      expect(state.isShowChatPage).toBe(false);
      expect(state.isSidebarCollapsed).toBe(false);
    });
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const state = chatPageReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({
        isSidebarCollapsed: false,
        isShowChatPage: false,
      });
    });

    it('不应包含未定义的字段', () => {
      const state = chatPageReducer(undefined, { type: 'unknown' });
      const keys = Object.keys(state);
      expect(keys).toHaveLength(2);
      expect(keys).toContain('isSidebarCollapsed');
      expect(keys).toContain('isShowChatPage');
    });
  });

  describe('Redux Toolkit 最佳实践', () => {
    it('应该保持不可变性（Immer）', () => {
      const originalState = { ...initialState };
      chatPageReducer(initialState, setIsCollapsed(true));
      expect(initialState).toEqual(originalState);
    });

    it('应该正确生成 action creators', () => {
      const collapseAction = setIsCollapsed(true);
      expect(collapseAction).toEqual({
        type: 'chatPage/setIsCollapsed',
        payload: true,
      });

      const showPageAction = setIsShowChatPage(true);
      expect(showPageAction).toEqual({
        type: 'chatPage/setIsShowChatPage',
        payload: true,
      });
    });

    it('应该正确导出 reducer 和 actions', () => {
      expect(typeof chatPageReducer).toBe('function');

      const state = chatPageReducer(undefined, { type: 'unknown' });
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });
  });

  describe('与 Redux store 的集成', () => {
    let store: any;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          chatPage: chatPageReducer,
        },
      });
    });

    it('应该在 store 中正常工作', () => {
      const state = store.getState().chatPage;
      expect(state).toEqual({
        isSidebarCollapsed: false,
        isShowChatPage: false,
      });
    });

    it('应该正确处理连续的多个 dispatch', () => {
      store.dispatch(setIsShowChatPage(true));
      expect(store.getState().chatPage.isShowChatPage).toBe(true);
      expect(store.getState().chatPage.isSidebarCollapsed).toBe(false);

      store.dispatch(setIsCollapsed(true));
      expect(store.getState().chatPage.isSidebarCollapsed).toBe(true);
      expect(store.getState().chatPage.isShowChatPage).toBe(true);

      store.dispatch(setIsShowChatPage(false));
      expect(store.getState().chatPage.isShowChatPage).toBe(false);
      expect(store.getState().chatPage.isSidebarCollapsed).toBe(true);
    });

    it('应该忽略不相关的 action', () => {
      const stateBefore = store.getState().chatPage;

      const unrelatedAction = createAction('other/action')();
      store.dispatch(unrelatedAction);

      const stateAfter = store.getState().chatPage;
      expect(stateAfter).toEqual(stateBefore);
    });
  });
});

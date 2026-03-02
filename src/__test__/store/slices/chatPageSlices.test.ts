/**
 * chatPageSlices 单元测试
 *
 * 测试聊天页面状态管理，包括侧边栏折叠状态和页面显示状态
 *
 * 删除的冗余测试（简单的 Redux reducer 测试）：
 * - 侧边栏折叠状态变更 (2 tests)：基本的 Redux reducer 状态转换
 * - 聊天页面显示状态变更 (2 tests)：基本的 Redux reducer 状态转换
 *
 * 保留的关键测试：
 * - Redux Toolkit 最佳实践：不可变性、action creators
 * - 与 Redux store 的集成：连续 dispatch、忽略不相关的 action
 * - 初始状态验证
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

  // 侧边栏折叠状态变更测试已被删除：基本的 Redux reducer 测试
  // 聊天页面显示状态变更测试已被删除：基本的 Redux reducer 测试

  describe('初始状态', () => {
    // 保留初始状态测试：验证 reducer 的默认行为
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

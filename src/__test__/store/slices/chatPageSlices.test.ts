/**
 * chatPageSlices 单元测试
 *
 * 测试聊天页面状态管理，包括侧边栏折叠状态和页面显示状态
 *
 * 删除的冗余测试（简单的 Redux reducer 测试）：
 * - 侧边栏折叠状态变更 (2 tests)：基本的 Redux reducer 状态转换
 * - 聊天页面显示状态变更 (2 tests)：基本的 Redux reducer 状态转换
 * - Redux Toolkit 最佳实践 (3 tests)：框架保证（不可变性、action type 生成）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore, createAction } from '@reduxjs/toolkit';
import chatPageReducer, {
  setIsCollapsed,
  setIsShowChatPage,
  toggleDrawer,
  setIsDrawerOpen,
} from '@/store/slices/chatPageSlices';
import settingPageReducer, { toggleDrawer as settingToggleDrawer, setIsDrawerOpen as settingSetIsDrawerOpen } from '@/store/slices/settingPageSlices';
import modelPageReducer, { toggleDrawer as modelToggleDrawer } from '@/store/slices/modelPageSlices';

describe('chatPageSlices', () => {
  // 侧边栏折叠状态变更测试已被删除：基本的 Redux reducer 测试
  // 聊天页面显示状态变更测试已被删除：基本的 Redux reducer 测试

  describe('初始状态', () => {
    // 保留初始状态测试：验证 reducer 的默认行为
    it('应该返回正确的初始状态', () => {
      const state = chatPageReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({
        isSidebarCollapsed: false,
        isShowChatPage: false,
        isDrawerOpen: false,
      });
    });

    it('不应包含未定义的字段', () => {
      const state = chatPageReducer(undefined, { type: 'unknown' });
      const keys = Object.keys(state);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('isSidebarCollapsed');
      expect(keys).toContain('isShowChatPage');
      expect(keys).toContain('isDrawerOpen');
    });
  });

  describe('与 Redux store 的集成', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: Redux Toolkit 严格类型系统限制
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
        isDrawerOpen: false,
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

  describe('抽屉状态管理', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let store: any;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          chatPage: chatPageReducer,
        },
      });
    });

    it('dispatch toggleDrawer 应该切换抽屉状态', () => {
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);

      store.dispatch(toggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      store.dispatch(toggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('dispatch setIsDrawerOpen 应该设置抽屉状态', () => {
      store.dispatch(setIsDrawerOpen(true));
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      store.dispatch(setIsDrawerOpen(false));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('重复 dispatch toggleDrawer 应该正确切换状态', () => {
      for (let i = 0; i < 4; i++) {
        store.dispatch(toggleDrawer());
      }
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('setIsDrawerOpen 应该覆盖当前状态', () => {
      store.dispatch(toggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      store.dispatch(setIsDrawerOpen(true));
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      store.dispatch(setIsDrawerOpen(false));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });
  });

  describe('多页面抽屉状态独立管理', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let store: any;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          chatPage: chatPageReducer,
          settingPage: settingPageReducer,
          modelPage: modelPageReducer,
        },
      });
    });

    it('Chat 和 Setting 页面的抽屉状态应该独立', () => {
      store.dispatch(toggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);

      store.dispatch(settingToggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      store.dispatch(setIsDrawerOpen(false));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);
    });

    it('Chat、Setting 和 Model 创建页面的抽屉状态应该互不影响', () => {
      store.dispatch(toggleDrawer());
      store.dispatch(settingToggleDrawer());
      store.dispatch(modelToggleDrawer());

      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      store.dispatch(settingSetIsDrawerOpen(false));

      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);
    });
  });
});

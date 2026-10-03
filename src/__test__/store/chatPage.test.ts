/**
 * 页面状态 store 单元测试
 *
 * 测试聊天/设置/模型页面状态管理，包括侧边栏折叠、页面显示与抽屉状态
 *
 * 转写自 Redux slices 测试，行为断言保持一致
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useChatPageStore } from '@/store/chatPage';
import { useSettingPageStore } from '@/store/settingPage';
import { useModelPageStore } from '@/store/modelPage';

describe('chatPage store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const store = useChatPageStore();
      expect(store.isSidebarCollapsed).toBe(false);
      expect(store.isShowChatPage).toBe(false);
      expect(store.isDrawerOpen).toBe(false);
    });
  });

  describe('状态设置', () => {
    it('应该正确处理连续的多个状态设置', () => {
      const store = useChatPageStore();

      store.setIsShowChatPage(true);
      expect(store.isShowChatPage).toBe(true);
      expect(store.isSidebarCollapsed).toBe(false);

      store.setIsCollapsed(true);
      expect(store.isSidebarCollapsed).toBe(true);
      expect(store.isShowChatPage).toBe(true);

      store.setIsShowChatPage(false);
      expect(store.isShowChatPage).toBe(false);
      expect(store.isSidebarCollapsed).toBe(true);
    });
  });

  describe('抽屉状态管理', () => {
    it('toggleDrawer 应该切换抽屉状态', () => {
      const store = useChatPageStore();
      expect(store.isDrawerOpen).toBe(false);

      store.toggleDrawer();
      expect(store.isDrawerOpen).toBe(true);

      store.toggleDrawer();
      expect(store.isDrawerOpen).toBe(false);
    });

    it('setIsDrawerOpen 应该设置抽屉状态', () => {
      const store = useChatPageStore();

      store.setIsDrawerOpen(true);
      expect(store.isDrawerOpen).toBe(true);

      store.setIsDrawerOpen(false);
      expect(store.isDrawerOpen).toBe(false);
    });

    it('重复 toggleDrawer 应该正确切换状态', () => {
      const store = useChatPageStore();
      for (let i = 0; i < 4; i++) {
        store.toggleDrawer();
      }
      expect(store.isDrawerOpen).toBe(false);
    });

    it('setIsDrawerOpen 应该覆盖当前状态', () => {
      const store = useChatPageStore();

      store.toggleDrawer();
      expect(store.isDrawerOpen).toBe(true);

      store.setIsDrawerOpen(true);
      expect(store.isDrawerOpen).toBe(true);

      store.setIsDrawerOpen(false);
      expect(store.isDrawerOpen).toBe(false);
    });
  });

  describe('多页面抽屉状态独立管理', () => {
    it('Chat 和 Setting 页面的抽屉状态应该独立', () => {
      const chatPageStore = useChatPageStore();
      const settingPageStore = useSettingPageStore();

      chatPageStore.toggleDrawer();
      expect(chatPageStore.isDrawerOpen).toBe(true);
      expect(settingPageStore.isDrawerOpen).toBe(false);

      settingPageStore.toggleDrawer();
      expect(chatPageStore.isDrawerOpen).toBe(true);
      expect(settingPageStore.isDrawerOpen).toBe(true);

      chatPageStore.setIsDrawerOpen(false);
      expect(chatPageStore.isDrawerOpen).toBe(false);
      expect(settingPageStore.isDrawerOpen).toBe(true);
    });

    it('Chat、Setting 和 Model 页面的抽屉状态应该互不影响', () => {
      const chatPageStore = useChatPageStore();
      const settingPageStore = useSettingPageStore();
      const modelPageStore = useModelPageStore();

      chatPageStore.toggleDrawer();
      settingPageStore.toggleDrawer();
      modelPageStore.toggleDrawer();

      expect(chatPageStore.isDrawerOpen).toBe(true);
      expect(settingPageStore.isDrawerOpen).toBe(true);
      expect(modelPageStore.isDrawerOpen).toBe(true);

      settingPageStore.setIsDrawerOpen(false);

      expect(chatPageStore.isDrawerOpen).toBe(true);
      expect(settingPageStore.isDrawerOpen).toBe(false);
      expect(modelPageStore.isDrawerOpen).toBe(true);
    });
  });
});

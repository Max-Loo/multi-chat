/**
 * 页面级 store 单元测试（chatPage / modelPage / settingPage）
 *
 * 对应既有 Redux slice 语义：抽屉开关与侧边栏折叠。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatPageStore } from '@/stores/chatPageStore';
import { useModelPageStore } from '@/stores/modelPageStore';
import { useSettingPageStore } from '@/stores/settingPageStore';
import { setupPinia } from './setupPinia';

describe('chatPageStore', () => {
  beforeEach(() => {
    setupPinia();
  });

  it('初始状态：侧边栏展开、非聊天页、抽屉关闭', () => {
    const store = useChatPageStore();

    expect(store.isSidebarCollapsed).toBe(false);
    expect(store.isShowChatPage).toBe(false);
    expect(store.isDrawerOpen).toBe(false);
  });

  it('setIsCollapsed / setIsShowChatPage 更新状态', () => {
    const store = useChatPageStore();

    store.setIsCollapsed(true);
    store.setIsShowChatPage(true);

    expect(store.isSidebarCollapsed).toBe(true);
    expect(store.isShowChatPage).toBe(true);
  });

  it('toggleDrawer 在开/关之间切换', () => {
    const store = useChatPageStore();

    store.toggleDrawer();
    expect(store.isDrawerOpen).toBe(true);

    store.toggleDrawer();
    expect(store.isDrawerOpen).toBe(false);
  });

  it('setIsDrawerOpen 直接设置开关状态', () => {
    const store = useChatPageStore();

    store.setIsDrawerOpen(true);
    expect(store.isDrawerOpen).toBe(true);

    store.setIsDrawerOpen(false);
    expect(store.isDrawerOpen).toBe(false);
  });
});

describe('modelPageStore', () => {
  beforeEach(() => {
    setupPinia();
  });

  it('toggleDrawer 与 setIsDrawerOpen 语义正确', () => {
    const store = useModelPageStore();

    expect(store.isDrawerOpen).toBe(false);
    store.toggleDrawer();
    expect(store.isDrawerOpen).toBe(true);
    store.setIsDrawerOpen(false);
    expect(store.isDrawerOpen).toBe(false);
  });
});

describe('settingPageStore', () => {
  beforeEach(() => {
    setupPinia();
  });

  it('toggleDrawer 与 setIsDrawerOpen 语义正确', () => {
    const store = useSettingPageStore();

    expect(store.isDrawerOpen).toBe(false);
    store.toggleDrawer();
    expect(store.isDrawerOpen).toBe(true);
    store.setIsDrawerOpen(true);
    expect(store.isDrawerOpen).toBe(true);
  });
});

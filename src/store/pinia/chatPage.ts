import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * 聊天页面状态 Store（Pinia 版）
 *
 * 状态与动作与迁移前 Redux chatPage slice 一致：
 * 侧边栏折叠、聊天页面标记、移动端抽屉。
 */
export const useChatPageStore = defineStore('chatPage', () => {
  // ==== State ====
  /** 聊天侧边栏是否折叠 */
  const isSidebarCollapsed = ref(false);
  /** 是否位于具体聊天页面（目前只有在聊天页面才能折叠侧边栏，否则没有展开按钮来复原） */
  const isShowChatPage = ref(false);
  /** 移动端抽屉是否打开 */
  const isDrawerOpen = ref(false);

  // ==== Actions ====

  /** 设置侧边栏是否折叠 */
  const setIsCollapsed = (value: boolean) => {
    isSidebarCollapsed.value = value;
  };

  /** 设置是否位于具体聊天页面 */
  const setIsShowChatPage = (value: boolean) => {
    isShowChatPage.value = value;
  };

  /** 切换移动端抽屉开关状态 */
  const toggleDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value;
  };

  /** 设置移动端抽屉开关状态 */
  const setIsDrawerOpen = (value: boolean) => {
    isDrawerOpen.value = value;
  };

  return {
    // state
    isSidebarCollapsed,
    isShowChatPage,
    isDrawerOpen,
    // actions
    setIsCollapsed,
    setIsShowChatPage,
    toggleDrawer,
    setIsDrawerOpen,
  };
});

import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * 聊天页面状态接口
 */
export interface ChatPageSliceState {
  // 聊天侧边栏是否折叠
  isSidebarCollapsed: boolean;
  // 是否位于具体聊天页面（目前只有在聊天页面才能折叠侧边栏，否则没有展开按钮来复原）
  isShowChatPage: boolean;
  // 移动端抽屉是否打开
  isDrawerOpen: boolean;
}

/**
 * 聊天页面状态 store
 * 转写自 Redux chatPageSlice，行为逐条对应
 */
export const useChatPageStore = defineStore('chatPage', () => {
  // 聊天侧边栏是否折叠
  const isSidebarCollapsed = ref(false);
  // 是否位于具体聊天页面
  const isShowChatPage = ref(false);
  // 移动端抽屉是否打开
  const isDrawerOpen = ref(false);

  /**
   * 设置侧边栏是否折叠
   * @param value 是否折叠
   */
  function setIsCollapsed(value: boolean): void {
    isSidebarCollapsed.value = value;
  }

  /**
   * 设置是否位于具体聊天页面
   * @param value 是否位于聊天页面
   */
  function setIsShowChatPage(value: boolean): void {
    isShowChatPage.value = value;
  }

  /**
   * 切换移动端抽屉开关状态
   */
  function toggleDrawer(): void {
    isDrawerOpen.value = !isDrawerOpen.value;
  }

  /**
   * 设置移动端抽屉开关状态
   * @param value 是否打开
   */
  function setIsDrawerOpen(value: boolean): void {
    isDrawerOpen.value = value;
  }

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

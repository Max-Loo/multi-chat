/**
 * 聊天页面状态管理（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/chatPageSlices.ts
 * 管理聊天页面的侧边栏折叠与移动端抽屉状态。
 */
import { defineStore } from 'pinia';

/** 聊天页面状态接口（复用既有 slice 类型定义） */
export interface ChatPageStoreState {
  /** 聊天侧边栏是否折叠 */
  isSidebarCollapsed: boolean;
  /** 是否位于具体聊天页面（目前只有在聊天页面才能折叠侧边栏，否则没有展开按钮来复原） */
  isShowChatPage: boolean;
  /** 移动端抽屉是否打开 */
  isDrawerOpen: boolean;
}

export const useChatPageStore = defineStore('chatPage', {
  state: (): ChatPageStoreState => ({
    isSidebarCollapsed: false,
    isShowChatPage: false,
    isDrawerOpen: false,
  }),
  actions: {
    /** 设置侧边栏是否折叠 */
    setIsCollapsed(value: boolean) {
      this.isSidebarCollapsed = value;
    },
    /** 设置是否位于具体聊天页面 */
    setIsShowChatPage(value: boolean) {
      this.isShowChatPage = value;
    },
    /** 切换移动端抽屉开关状态 */
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
    },
    /** 设置移动端抽屉开关状态 */
    setIsDrawerOpen(value: boolean) {
      this.isDrawerOpen = value;
    },
  },
});

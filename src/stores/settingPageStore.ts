/**
 * 设置页面状态管理（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/settingPageSlices.ts
 * 管理设置页面的移动端抽屉开关状态。
 */
import { defineStore } from 'pinia';

/** 设置页面状态接口 */
export interface SettingPageStoreState {
  /** 移动端抽屉是否打开 */
  isDrawerOpen: boolean;
}

export const useSettingPageStore = defineStore('settingPage', {
  state: (): SettingPageStoreState => ({
    isDrawerOpen: false,
  }),
  actions: {
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

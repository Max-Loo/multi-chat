/**
 * 模型页面状态管理（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/modelPageSlices.ts
 * 管理模型页面的移动端抽屉开关状态。
 */
import { defineStore } from 'pinia';

/** 模型页面状态接口 */
export interface ModelPageStoreState {
  /** 移动端抽屉是否打开 */
  isDrawerOpen: boolean;
}

export const useModelPageStore = defineStore('modelPage', {
  state: (): ModelPageStoreState => ({
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

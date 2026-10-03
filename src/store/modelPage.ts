import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * 模型页面状态接口
 */
export interface ModelPageSliceState {
  /** 移动端抽屉是否打开 */
  isDrawerOpen: boolean;
}

/**
 * 模型页面状态 store
 * 转写自 Redux modelPageSlice，行为逐条对应
 */
export const useModelPageStore = defineStore('modelPage', () => {
  /** 移动端抽屉是否打开 */
  const isDrawerOpen = ref(false);

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
    isDrawerOpen,
    // actions
    toggleDrawer,
    setIsDrawerOpen,
  };
});

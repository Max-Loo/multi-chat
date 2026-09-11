import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * 模型页面状态 Store（Pinia 版）
 *
 * 状态与动作与迁移前 Redux modelPage slice 一致：移动端抽屉开关。
 */
export const useModelPageStore = defineStore('modelPage', () => {
  // ==== State ====
  /** 移动端抽屉是否打开 */
  const isDrawerOpen = ref(false);

  // ==== Actions ====

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
    isDrawerOpen,
    // actions
    toggleDrawer,
    setIsDrawerOpen,
  };
});

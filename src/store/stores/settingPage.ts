import { ref } from "vue";
import { defineStore } from "pinia";

/**
 * 设置页面状态 store（对应原 settingPageSlices）
 * @description 管理设置页面的抽屉打开/关闭状态
 */
export const useSettingPageStore = defineStore("settingPage", () => {
  /** 移动端抽屉是否打开 */
  const isDrawerOpen = ref(false);

  /** 切换移动端抽屉开关状态 */
  function toggleDrawer(): void {
    isDrawerOpen.value = !isDrawerOpen.value;
  }

  /** 设置移动端抽屉开关状态 */
  function setIsDrawerOpen(value: boolean): void {
    isDrawerOpen.value = value;
  }

  return {
    isDrawerOpen,
    toggleDrawer,
    setIsDrawerOpen,
  };
});

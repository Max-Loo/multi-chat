/**
 * 重置数据对话框组合式函数（Vue 版 useResetDataDialog）
 *
 * 封装重置确认流程的状态和逻辑，供 FatalErrorScreen 和 KeyManagementSetting 共用。
 * 配合 ResetDataDialog.vue 组件使用。
 */
import { ref } from 'vue';
import { resetAllData } from '@/utils/resetAllData';

/**
 * 提供重置数据对话框的状态和确认处理逻辑
 * @returns 对话框开关状态、重置中状态、确认处理函数
 */
export const useResetDataDialog = () => {
  const isDialogOpen = ref(false);
  const isResetting = ref(false);

  const setIsDialogOpen = (open: boolean) => {
    isDialogOpen.value = open;
  };

  /** 确认重置：成功后刷新页面，失败时关闭对话框并保留交互能力 */
  const handleConfirmReset = async () => {
    isResetting.value = true;
    try {
      await resetAllData();
      window.location.reload();
    } catch (error) {
      console.error('重置数据失败:', error);
      isResetting.value = false;
      isDialogOpen.value = false;
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    isResetting,
    handleConfirmReset,
  };
};

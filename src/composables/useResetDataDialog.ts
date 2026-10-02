/**
 * 重置数据对话框组合式函数（对应旧版 hooks/useResetDataDialog.tsx）
 *
 * 封装重置确认流程的状态和逻辑，供 FatalErrorScreen 和 KeyManagementSetting 共用。
 * Vue 版将对话框渲染为组件（ResetDataDialog），本组合式函数只承载状态与确认逻辑。
 */
import { ref, type Ref } from 'vue';
import { resetAllData } from '@/utils/resetAllData';

/**
 * 提供重置数据对话框的状态和确认处理逻辑
 */
export const useResetDataDialog = (): {
  isDialogOpen: Ref<boolean>;
  setIsDialogOpen: (open: boolean) => void;
  isResetting: Ref<boolean>;
  handleConfirmReset: () => Promise<void>;
} => {
  const isDialogOpen = ref(false);
  const isResetting = ref(false);

  /** 确认重置（成功后整页刷新） */
  const handleConfirmReset = async (): Promise<void> => {
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
    setIsDialogOpen: (open: boolean) => {
      isDialogOpen.value = open;
    },
    isResetting,
    handleConfirmReset,
  };
};

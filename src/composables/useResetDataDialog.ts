/**
 * 重置数据对话框 Composable（对应原 hooks/useResetDataDialog.tsx）
 * 封装重置确认流程的状态和逻辑，供 FatalErrorScreen 和 KeyManagementSetting 共用
 *
 * @example
 * const { isDialogOpen, setIsDialogOpen, isResetting, handleConfirmReset } = useResetDataDialog();
 * // 模板中：<ResetDataDialog :open="isDialogOpen" :is-resetting="isResetting"
 * //   @update:open="setIsDialogOpen" @confirm="handleConfirmReset" />
 */
import { ref } from "vue";
import { resetAllData } from "@/utils/resetAllData";

export function useResetDataDialog() {
  /** 对话框开关状态 */
  const isDialogOpen = ref(false);
  /** 重置进行中标志 */
  const isResetting = ref(false);

  /**
   * 确认重置：执行重置并刷新页面
   */
  async function handleConfirmReset(): Promise<void> {
    isResetting.value = true;
    try {
      await resetAllData();
      window.location.reload();
    } catch (error) {
      console.error("重置数据失败:", error);
      isResetting.value = false;
      isDialogOpen.value = false;
    }
  }

  /**
   * 设置对话框开关状态
   */
  function setIsDialogOpen(open: boolean): void {
    isDialogOpen.value = open;
  }

  return {
    isDialogOpen,
    setIsDialogOpen,
    isResetting,
    handleConfirmReset,
  };
}

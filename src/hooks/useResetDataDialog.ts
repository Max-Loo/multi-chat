/**
 * 重置数据对话框 Hook
 * 封装重置确认流程的状态和逻辑，供 FatalErrorScreen 和 KeyManagementSetting 共用
 */
import { useState } from "react";
import { resetAllData } from "@/utils/resetAllData";

/**
 * 提供重置数据对话框的状态和确认处理逻辑
 * @returns 对话框开关状态、重置中状态和确认处理函数
 */
export const useResetDataDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetAllData();
      window.location.reload();
    } catch (error) {
      console.error('重置数据失败:', error);
      setIsResetting(false);
      setIsDialogOpen(false);
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    isResetting,
    handleConfirmReset,
  };
};

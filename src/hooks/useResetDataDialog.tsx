/**
 * 重置数据对话框 Hook
 * 封装重置确认流程的状态和逻辑，供 FatalErrorScreen 和 KeyManagementSetting 共用
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resetAllData } from "@/utils/resetAllData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 提供重置数据对话框的状态和确认处理逻辑
 * @returns 对话框开关状态、重置中状态、确认处理函数和渲染函数
 */
export const useResetDataDialog = () => {
  const { t } = useTranslation();
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

  /** 渲染重置确认对话框 */
  const renderResetDialog = () => (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t($ => $.common.resetConfirmTitle)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t($ => $.common.resetConfirmDescription)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>
            {t($ => $.common.cancel)}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmReset}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t($ => $.common.resetConfirmAction)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    isDialogOpen,
    setIsDialogOpen,
    isResetting,
    handleConfirmReset,
    renderResetDialog,
  };
};

import { Button } from "@/components/ui/button";
import { AlertOctagon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import type { InitError } from "@/services/initialization";
import { STEP_NAMES } from "@/config/initSteps";
import { useResetDataDialog } from "@/hooks/useResetDataDialog";
import { KeyRecoveryDialog } from "@/components/KeyRecoveryDialog";
import { useState } from "react";

/**
 * 致命错误屏幕组件属性
 */
interface FatalErrorScreenProps {
  /** 错误列表 */
  errors: InitError[];
}

/**
 * 处理刷新页面
 */
const handleRefresh = () => {
  window.location.reload();
};

/**
 * 格式化错误详情为可读字符串
 */
const formatErrorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return JSON.stringify(error, null, 2);
};

/**
 * 致命错误屏幕组件
 * 显示初始化过程中的致命错误和恢复选项
 */
export const FatalErrorScreen: React.FC<FatalErrorScreenProps> = ({ errors }) => {
  const { t } = useTranslation();
  const { setIsDialogOpen: setIsResetDialogOpen, isResetting, renderResetDialog } = useResetDataDialog();
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);

  /** 检测是否有 masterKey 步骤的 fatal 错误 */
  const hasMasterKeyError = errors.some((error) => error.stepName === STEP_NAMES.masterKey);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
      <div className="flex max-w-2xl flex-col gap-6">
        {/* 错误图标和标题 */}
        <div className="flex flex-col items-center text-center gap-4">
          <AlertOctagon className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-semibold">
            {t($ => $.common.initializationFailed)}
          </h1>
          <p className="text-muted-foreground">
            {t($ => $.common.initializationFailedDescription)}
          </p>
        </div>

        {/* 错误列表 */}
        <div className="flex flex-col gap-3">
          {errors.map((error, index) => {
            const shouldShowErrorDetails = import.meta.env.DEV && error.originalError != null;

            return (
              <Alert key={index} variant="destructive" className="p-4">
                <AlertOctagon className="h-4 w-4" />
                <AlertTitle>
                  {error.message}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  {/* 开发模式下显示错误详情 */}
                  {shouldShowErrorDetails && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        {t($ => $.common.showErrorDetails)}
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-48">
                        {formatErrorDetails(error.originalError)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col items-center gap-3">
          <Button onClick={handleRefresh} size="lg" disabled={isResetting}>
            {t($ => $.common.refreshPage)}
          </Button>
          <div className="w-full border-t" />
          <div className="flex flex-row flex-wrap items-center justify-center gap-3">
            {hasMasterKeyError && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsRecoveryDialogOpen(true)}
                disabled={isResetting}
              >
                {t($ => $.common.masterKeyRegeneratedImport)}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsResetDialogOpen(true)}
              disabled={isResetting}
            >
              {t($ => $.common.resetAllData)}
            </Button>
          </div>
        </div>
      </div>

      {/* 重置确认对话框 */}
      {renderResetDialog()}

      {/* 密钥恢复对话框 */}
      <KeyRecoveryDialog open={isRecoveryDialogOpen} onOpenChange={setIsRecoveryDialogOpen} />
    </div>
  );
};

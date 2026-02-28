import { Button } from "@/components/ui/button";
import { AlertOctagon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import type { InitError } from "@/lib/initialization";

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
        <div className="flex flex-col gap-4">
          {errors.map((error, index) => {
            const shouldShowErrorDetails = import.meta.env.DEV && error.originalError != null;

            return (
              <Alert key={index} variant="destructive">
                <AlertOctagon className="h-4 w-4" />
                <AlertTitle>
                  {error.message}
                </AlertTitle>
                <AlertDescription>
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

        {/* 刷新按钮 */}
        <div className="flex justify-center">
          <Button onClick={handleRefresh} size="lg">
            {t($ => $.common.refreshPage)}
          </Button>
        </div>
      </div>
    </div>
  );
};

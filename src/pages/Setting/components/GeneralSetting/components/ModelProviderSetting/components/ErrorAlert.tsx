import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorAlert 组件的属性
 */
interface ErrorAlertProps {
  /** 错误信息 */
  error: string | null;
}

/**
 * 错误提示组件
 * 使用 shadcn/ui Alert 组件显示错误信息
 */
export const ErrorAlert = React.memo<ErrorAlertProps>(({ error }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        刷新失败: {error}
      </AlertDescription>
    </Alert>
  );
});

ErrorAlert.displayName = 'ErrorAlert';

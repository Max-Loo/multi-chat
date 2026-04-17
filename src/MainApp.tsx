/**
 * 主应用组件
 *
 * 包含重型依赖（Redux store、Router、Toast 等），通过动态导入实现按需加载
 */
import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "@/store";
import router from "@/router";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { ToasterWrapper } from "@/services/toast/ToasterWrapper";
import { handleSecurityWarning } from "@/store/keyring/masterKey";
import { hasEncryptedModels } from "@/store/storage/modelStorage";
import { triggerSilentRefreshIfNeeded } from "@/store/slices/modelProviderSlice";
import { toastQueue } from "@/services/toast";
import type { InitResult } from "@/services/initialization";
import { useTranslation } from "react-i18next";
import { KeyRecoveryDialog } from "@/components/KeyRecoveryDialog";

/**
 * 创建主应用组件的工厂函数
 * @param result 初始化结果
 * @returns 主应用 React 组件
 */
export function createMainApp(result: InitResult) {
  return function MainApp() {
    const { t } = useTranslation();
    const notifiedRef = useRef(false);
    const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);

    useEffect(() => {
      triggerSilentRefreshIfNeeded(store);
    }, []);

    useEffect(() => {
      handleSecurityWarning();
    }, []);

    useEffect(() => {
      if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => {
          toastQueue.warning(warning.message, {
            description: import.meta.env.DEV
              ? String(warning.originalError)
              : undefined,
          });
        });
      }
    }, []);

    useEffect(() => {
      if (notifiedRef.current) return;

      // 解密失败通知优先于密钥重新生成通知
      if (result.decryptionFailureCount && result.decryptionFailureCount > 0) {
        notifiedRef.current = true;
        toastQueue.warning(
          t(($) => $.common.decryptionFailureMessage, { count: result.decryptionFailureCount }),
          {
            duration: Infinity,
            action: {
              label: t(($) => $.common.decryptionFailureImport),
              onClick: () => {
                setIsRecoveryDialogOpen(true);
              },
            },
            cancel: {
              label: t(($) => $.common.decryptionFailureDismiss),
              onClick: () => {},
            },
          },
        );
        return;
      }

      if (!result.masterKeyRegenerated) return;

      notifiedRef.current = true;

      const checkAndNotify = async () => {
        const hasEncryptedData = await hasEncryptedModels();
        if (!hasEncryptedData) return;

        toastQueue.warning(
          t(($) => $.common.masterKeyRegeneratedMessage),
          {
            duration: Infinity,
            action: {
              label: t(($) => $.common.masterKeyRegeneratedImport),
              onClick: () => {
                setIsRecoveryDialogOpen(true);
              },
            },
            cancel: {
              label: t(($) => $.common.masterKeyRegeneratedDismiss),
              onClick: () => {},
            },
          },
        );
      };

      checkAndNotify();
    }, [t]);

    return (
      <Provider store={store}>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <ToasterWrapper />
          <KeyRecoveryDialog open={isRecoveryDialogOpen} onOpenChange={setIsRecoveryDialogOpen} />
        </ConfirmProvider>
      </Provider>
    );
  };
}

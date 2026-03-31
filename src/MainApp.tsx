/**
 * 主应用组件
 *
 * 包含重型依赖（Redux store、Router、Toast 等），通过动态导入实现按需加载
 */
import { useEffect } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "@/store";
import router from "@/router";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { ToasterWrapper } from "@/services/toast/ToasterWrapper";
import { handleSecurityWarning } from "@/store/keyring/masterKey";
import { triggerSilentRefreshIfNeeded } from "@/store/slices/modelProviderSlice";
import { toastQueue } from "@/services/toast";
import type { InitResult } from "@/services/initialization";

/**
 * 创建主应用组件的工厂函数
 * @param result 初始化结果
 * @returns 主应用 React 组件
 */
export function createMainApp(result: InitResult) {
  return function MainApp() {
    /**
     * 主应用挂载后执行副作用
     */
    useEffect(() => {
      // 后台静默刷新 modelProvider 数据，保持数据新鲜度
      triggerSilentRefreshIfNeeded(store);
    }, []);

    /**
     * 处理安全性警告（现在可以使用 Toast）
     * 注意：这个副作用在 MainApp 挂载后执行，而不是在初始化完成后立即执行
     */
    useEffect(() => {
      const runSecurityWarning = async () => {
        await handleSecurityWarning();
      };
      runSecurityWarning();
    }, []);

    /**
     * 显示初始化过程中的警告错误
     * 注意：result 是通过闭包传入的，组件创建时确定，不需要作为依赖
     */
    useEffect(() => {
      if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => {
          // 在开发环境下显示详细错误信息，生产环境下只显示简化消息
          toastQueue.warning(warning.message, {
            description: import.meta.env.DEV
              ? String(warning.originalError)
              : undefined,
          });
        });
      }
    }, []);

    return (
      <Provider store={store}>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <ToasterWrapper />
        </ConfirmProvider>
      </Provider>
    );
  };
}

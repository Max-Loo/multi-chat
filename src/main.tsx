import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import "./main.css";
import { interceptClickAToJump } from "./lib/global";
import { handleSecurityWarning } from "@/store/keyring/masterKey";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { toastQueue } from "@/lib/toast";
import { RouterProvider } from "react-router-dom";
import router from "@/router";
import { ToasterWrapper } from "@/lib/toast/ToasterWrapper";
import { triggerSilentRefreshIfNeeded } from "@/store/slices/modelProviderSlice";
import { InitializationController } from "@/components/InitializationController";
import type { InitResult } from "@/lib/initialization";

/**
 * 应用主组件
 * 管理初始化状态，根据初始化结果渲染不同界面
 */
const App: React.FC = () => {
  const [appState, setAppState] = useState<'initializing' | 'ready'>('initializing');

  /**
   * 处理初始化完成
   * 根据结果处理警告 Toast、安全警告、静默刷新
   */
  const handleInitComplete = useCallback(async (result: InitResult) => {
    // 显示警告错误 Toast
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

    // 切换到就绪状态
    setAppState('ready');

    // 应用渲染后，处理安全性警告（现在可以使用 Toast）
    await handleSecurityWarning();

    // 后台静默刷新 modelProvider 数据，保持数据新鲜度
    triggerSilentRefreshIfNeeded(store);
  }, []);

  // 初始化中，显示进度条
  if (appState === 'initializing') {
    return <InitializationController onComplete={handleInitComplete} />;
  }

  // 初始化完成，渲染主应用
  return (
    <Provider store={store}>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <ToasterWrapper />
      </ConfirmProvider>
    </Provider>
  );
};

// 创建 React 根节点并渲染
const rootDom = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

rootDom.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

interceptClickAToJump();

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import './main.css'
import { interceptClickAToJump } from "./lib/global";
import InitializationScreen from "./components/InitializationScreen";
import { FatalErrorScreen } from "./components/FatalErrorScreen";
import { NoProvidersAvailable } from '@/components/NoProvidersAvailable';
import { handleSecurityWarning } from "@/store/keyring/masterKey";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { InitializationManager } from "@/lib/initialization";
import { initSteps } from "@/config/initSteps";
import { RouterProvider } from "react-router-dom";
import router from '@/router';

const rootDom = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

// 先预渲染初始化屏幕
rootDom.render(<InitializationScreen />);

interceptClickAToJump();

// 使用新的初始化系统执行初始化
const manager = new InitializationManager();
const result = await manager.runInitialization({
  steps: initSteps,
  onProgress: (current, total, currentStep) => {
    console.log(`初始化进度: ${current}/${total} - ${currentStep}`);
  },
});

// 根据初始化结果渲染不同界面
if (!result.success) {
  // 初始化失败，显示致命错误屏幕
  rootDom.render(
    <React.StrictMode>
      <FatalErrorScreen errors={result.fatalErrors} />
      <Toaster />
    </React.StrictMode>
  );
} else {
  // 初始化成功，检查 modelProvider 的致命错误
  const modelProviderError = store.getState().modelProvider.error;
  const modelProviderLoading = store.getState().modelProvider.loading;

  // 检查是否应该显示"无可用的模型供应商"错误提示
  const shouldShowNoProvidersError =
    !modelProviderLoading &&
    modelProviderError === '无法获取模型供应商数据，请检查网络连接';

  if (shouldShowNoProvidersError) {
    // 显示无可用模型供应商提示
    rootDom.render(
      <React.StrictMode>
        <NoProvidersAvailable />
        <Toaster />
      </React.StrictMode>
    );
  } else {
    // 正常渲染应用
    rootDom.render(
      <React.StrictMode>
        <Provider store={store}>
          <ConfirmProvider>
            <RouterProvider router={router} />
            <Toaster />
          </ConfirmProvider>
        </Provider>
      </React.StrictMode>
    );
  }

  // 显示警告错误 Toast
  if (result.warnings.length > 0) {
    result.warnings.forEach((warning) => {
      toast.warning(warning.message, {
        description: import.meta.env.DEV ? String(warning.originalError) : undefined,
      });
    });
  }

  // 应用渲染后，处理安全性警告（现在可以使用 Toast）
  await handleSecurityWarning();
}

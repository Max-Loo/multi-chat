import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import './main.css'
import { interceptClickAToJump } from "./lib/global";
import FullscreenLoading from "./components/FullscreenLoading";
import AppRoot from './components/AppRoot';
import { initI18n } from '@/lib/i18n';
import { initializeMasterKey, handleSecurityWarning } from "@/store/keyring/masterKey";
import { initializeModels } from "@/store/slices/modelSlice";
import { initializeChatList } from "@/store/slices/chatSlices";
import { initializeAppLanguage, initializeIncludeReasoningContent } from "@/store/slices/appConfigSlices";
import { initializeModelProvider } from "@/store/slices/modelProviderSlice";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { Toaster } from "./components/ui/sonner";

const rootDom = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

// 先预渲染一个开屏动画
rootDom.render(<FullscreenLoading />)

interceptClickAToJump()

// 阻断式的初始化逻辑（渲染前需要保证初始化完成）
const InterruptiveInitPromise = Promise.all([
  initI18n(),
  initializeMasterKey(),
]);

// 可以异步完成的初始化逻辑
store.dispatch(initializeModelProvider())
store.dispatch(initializeModels())
store.dispatch(initializeChatList())
store.dispatch(initializeAppLanguage())
store.dispatch(initializeIncludeReasoningContent())

// 渲染真正的页面
await InterruptiveInitPromise

rootDom.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfirmProvider>
        <AppRoot />
        <Toaster />
      </ConfirmProvider>
    </Provider>
  </React.StrictMode>,
)

// 应用渲染后，处理安全性警告（现在可以使用 Toast）
await handleSecurityWarning();

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import './main.css'
import { interceptClickAToJump } from "./lib/global";
import FullscreenLoading from "./components/FullscreenLoading";
import { App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { initI18n } from '@/lib/i18n';
import { initializeModels } from "@/store/slices/modelSlice";
import { initializeChatList } from "@/store/slices/chatSlices";
import { initializeAppLanguage } from "@/store/slices/appConfigSlices";
import { registerAllProviders } from "./lib/factory/modelProviderFactory/ProviderRegistry";

const rootDom = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

// 先预渲染一个开屏动画
rootDom.render(<FullscreenLoading />)

registerAllProviders()
interceptClickAToJump()

// 阻断式的初始化逻辑（渲染前需要保证初始化完成
const InterruptiveInitPromise = initI18n()

// 可以异步完成的初始化逻辑
store.dispatch(initializeModels())
store.dispatch(initializeChatList())
store.dispatch(initializeAppLanguage())

// 渲染真正的页面
await InterruptiveInitPromise

rootDom.render(
  <React.StrictMode>
    <Provider store={store}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </Provider>
  </React.StrictMode>,
)

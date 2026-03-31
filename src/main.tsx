import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./main.css";
import { interceptClickAToJump } from "@/services/global";
import { InitializationController } from "@/components/InitializationController";
import type { InitResult, InitStep } from "@/services/initialization";

// 异步导入 initSteps，确保依赖模块正确初始化
const initStepsModule = await import("@/config/initSteps");

// 打印应用版本号到控制台
console.log(
  `%c Multi Chat %c v${__APP_VERSION__} `,
  "background:#2563eb; color:white; border-radius:3px 0 0 3px; padding:2px 5px;",
  "background:#1e40af; color:white; border-radius:0 3px 3px 0; padding:2px 5px;",
);

/**
 * 加载错误状态
 */
interface LoadError {
  message: string;
  phase: "initsteps" | "mainapp";
}

/**
 * 应用主组件
 * 管理加载流程：HTML Spinner → 初始化动画 → 主应用
 */
const App: React.FC = () => {
  // initSteps 模块（动态加载）
  const [initSteps, setInitSteps] = useState<InitStep[] | null>(null);
  // 应用状态：loading → initializing → ready
  const [appState, setAppState] = useState<
    "loading" | "initializing" | "ready"
  >("loading");
  // 主应用组件（动态加载）
  const [MainAppComponent, setMainAppComponent] =
    useState<React.ComponentType | null>(null);
  // 错误状态
  const [error, setError] = useState<LoadError | null>(null);

  /**
   * 阶段 2：设置 initSteps（已通过顶层 await 加载完成）
   */
  useEffect(() => {
    setInitSteps(initStepsModule.initSteps);
    setAppState("initializing");
  }, []);

  /**
   * 阶段 4：初始化完成后动态加载主应用
   */
  const handleInitComplete = useCallback(async (result: InitResult) => {
    try {
      const { createMainApp } = await import("./MainApp");
      setMainAppComponent(() => createMainApp(result));
      setAppState("ready");
    } catch (err) {
      console.error(err);
      setError({
        message: "应用加载失败，请检查网络连接",
        phase: "mainapp",
      });
    }
  }, []);

  /**
   * 重试加载
   */
  const handleRetry = useCallback(() => {
    // 刷新页面重试
    window.location.reload();
  }, []);

  // 错误状态：显示错误提示界面
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-dvh bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-foreground">{error.message}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 阶段 1-2：initSteps 加载中，继续显示 HTML Spinner
  if (appState === "loading" || !initSteps) {
    return null;
  }

  // 阶段 3：初始化中，显示初始化动画
  if (appState === "initializing") {
    return (
      <InitializationController
        initSteps={initSteps}
        onComplete={handleInitComplete}
      />
    );
  }

  // 阶段 4：初始化完成，渲染主应用
  return MainAppComponent ? <MainAppComponent /> : null;
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

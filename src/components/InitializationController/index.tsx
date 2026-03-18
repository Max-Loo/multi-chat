/**
 * 初始化控制器组件
 *
 * 职责：执行初始化、更新进度、返回初始化结果（成功/失败/警告）
 * 不处理 Toast、安全警告等副作用（由父组件 App 处理）
 */
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { FatalErrorScreen } from "@/components/FatalErrorScreen";
import { NoProvidersAvailable } from "@/components/NoProvidersAvailable";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { InitializationManager } from "@/lib/initialization";
import type { InitResult, InitError, InitStep } from "@/lib/initialization";

/**
 * 初始化控制器属性
 */
interface InitializationControllerProps {
  /** 初始化步骤列表（由外部传入，实现依赖注入） */
  initSteps: InitStep[];
  /** 初始化完成回调 */
  onComplete: (result: InitResult) => void;
}

/**
 * 初始化状态
 */
interface InitializationState {
  /** 当前状态：初始化中 | 成功 | 致命错误 | 无可用供应商 */
  status: "initializing" | "success" | "fatal_error" | "no_providers";
  /** 当前完成的步骤数（初始值为 0，确保进度条从 0% 开始） */
  currentStep: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 致命错误列表 */
  fatalErrors: InitError[];
  /** 警告列表 */
  warnings: InitError[];
  /** 是否准备好进入主应用（成功后延迟 500ms） */
  readyToProceed: boolean;
}

/**
 * 初始化控制器组件
 * 在 React 组件内执行初始化流程，实时更新进度条
 */
export const InitializationController: React.FC<
  InitializationControllerProps
> = ({ initSteps, onComplete }) => {
  // 初始化状态管理
  const [state, setState] = useState<InitializationState>({
    status: "initializing",
    currentStep: 0, // 初始值设为 0，确保进度条从 0% 开始
    totalSteps: initSteps.length,
    fatalErrors: [],
    warnings: [],
    readyToProceed: false,
  });

  // 动态三个点动画状态
  const [dots, setDots] = useState("");

  /**
   * 动态三个点动画（. → .. → ... 循环，每 500ms 更新）
   */
  useEffect(() => {
    if (state.status === "initializing") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 5 ? "" : prev + "."));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [state.status]);

  /**
   * 初始化完成后 500ms 延迟，再通知父组件
   */
  useEffect(() => {
    if (state.status === "success" && !state.readyToProceed) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, readyToProceed: true }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.readyToProceed]);

  /**
   * 当 readyToProceed 变为 true 时，通知父组件
   */
  useEffect(() => {
    if (state.readyToProceed && state.status === "success") {
      onComplete({
        success: true,
        fatalErrors: [],
        warnings: state.warnings,
        ignorableErrors: [],
        completedSteps: [],
      });
    }
  }, [state.readyToProceed, state.status, state.warnings, onComplete]);

  /**
   * 执行初始化
   */
  useEffect(() => {
    const runInit = async () => {
      const manager = new InitializationManager();
      const result = await manager.runInitialization({
        steps: initSteps,
        onProgress: (current, total, _currentStep) => {
          // 更新进度
          setState((prev) => ({
            ...prev,
            currentStep: current,
            totalSteps: total,
          }));
        },
      });

      if (!result.success) {
        // 初始化失败，显示致命错误屏幕
        setState((prev) => ({
          ...prev,
          status: "fatal_error",
          fatalErrors: result.fatalErrors,
        }));
      } else {
        // 从 result 中检查 modelProvider 状态（解耦 store 依赖）
        const modelProviderStatus = result.modelProviderStatus;

        // 检查是否应该显示"无可用的模型供应商"错误提示
        const shouldShowNoProvidersError =
          modelProviderStatus?.isNoProvidersError === true;

        if (shouldShowNoProvidersError) {
          // 显示无可用模型供应商提示
          setState((prev) => ({
            ...prev,
            status: "no_providers",
          }));
        } else {
          // 初始化成功，等待 500ms 延迟
          setState((prev) => ({
            ...prev,
            status: "success",
            warnings: result.warnings,
          }));
        }
      }
    };

    runInit();
  }, [initSteps]);

  // 计算进度百分比
  const progress = Math.round((state.currentStep / state.totalSteps) * 100);

  // 渲染错误状态
  if (state.status === "fatal_error") {
    return <FatalErrorScreen errors={state.fatalErrors} />;
  }

  if (state.status === "no_providers") {
    return <NoProvidersAvailable />;
  }

  // 渲染进度条 UI
  return (
    <div className="flex items-center justify-center w-full h-dvh bg-background">
      <div className="flex flex-col items-center gap-8 w-80">
        {/* Logo 动画 - 与进度条对齐（不包括百分比） */}
        <div className="w-full pr-10 flex justify-center">
          <AnimatedLogo />
        </div>

        {/* 进度条和百分比 */}
        <div className="w-full flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground w-10 text-right">
            {progress}%
          </span>
        </div>

        {/* 动态加载文本 - 与进度条对齐（不包括百分比） */}
        <div className="w-full pr-10 text-center">
          <p className="text-muted-foreground">
            Initializing application{dots}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InitializationController;

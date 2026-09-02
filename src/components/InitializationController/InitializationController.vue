<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Progress } from "@/components/ui/progress";
import { FatalErrorScreen } from "@/components/FatalErrorScreen";
import { NoProvidersAvailable } from "@/components/NoProvidersAvailable";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { InitializationManager } from "@/services/initialization";
import type {
  InitResult,
  InitError,
  InitStep,
} from "@/services/initialization";

/**
 * 初始化控制器组件
 *
 * 职责：执行初始化、更新进度、返回初始化结果（成功/失败/警告）
 * 不处理 Toast、安全警告等副作用（由父组件 App 处理）
 */

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

const props = defineProps<InitializationControllerProps>();

// 初始化状态管理
const state = reactive<InitializationState>({
  status: "initializing",
  currentStep: 0, // 初始值设为 0，确保进度条从 0% 开始
  totalSteps: props.initSteps.length,
  fatalErrors: [],
  warnings: [],
  readyToProceed: false,
});

// 动态三个点动画状态
const dots = ref("");

/** 计算进度百分比 */
const progress = computed(() =>
  Math.round((state.currentStep / state.totalSteps) * 100),
);

// 动态三个点动画定时器句柄
let dotsTimer: ReturnType<typeof setInterval> | null = null;
// 成功后延迟通知的定时器句柄
let proceedTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 动态三个点动画（. → .. → ... 循环，每 200ms 更新）
 */
function startDotsAnimation(): void {
  stopDotsAnimation();
  dotsTimer = setInterval(() => {
    dots.value = dots.value.length >= 5 ? "" : dots.value + ".";
  }, 200);
}

function stopDotsAnimation(): void {
  if (dotsTimer !== null) {
    clearInterval(dotsTimer);
    dotsTimer = null;
  }
}

/**
 * 初始化完成后 500ms 延迟，再通知父组件
 */
function scheduleProceed(): void {
  proceedTimer = setTimeout(() => {
    state.readyToProceed = true;

    // 通知父组件
    props.onComplete({
      success: true,
      fatalErrors: [],
      warnings: state.warnings,
      ignorableErrors: [],
      completedSteps: [],
    });
  }, 500);
}

/**
 * 执行初始化
 */
async function runInit(): Promise<void> {
  const manager = new InitializationManager();
  const result = await manager.runInitialization({
    steps: props.initSteps,
    onProgress: (current, total, _currentStep) => {
      // 更新进度
      state.currentStep = current;
      state.totalSteps = total;
    },
  });

  stopDotsAnimation();

  if (!result.success) {
    // 初始化失败，显示致命错误屏幕
    state.status = "fatal_error";
    state.fatalErrors = result.fatalErrors;
  } else {
    // 从 result 中检查 modelProvider 状态（解耦 store 依赖）
    const modelProviderStatus = result.modelProviderStatus;

    // 检查是否应该显示"无可用的模型供应商"错误提示
    const shouldShowNoProvidersError =
      modelProviderStatus?.isNoProvidersError === true;

    if (shouldShowNoProvidersError) {
      // 显示无可用模型供应商提示
      state.status = "no_providers";
    } else {
      // 初始化成功，等待 500ms 延迟
      state.status = "success";
      state.warnings = result.warnings;
      scheduleProceed();
    }
  }
}

onMounted(() => {
  startDotsAnimation();
  void runInit();
});

// 卸载时清理定时器
onBeforeUnmount(() => {
  stopDotsAnimation();
  if (proceedTimer !== null) {
    clearTimeout(proceedTimer);
    proceedTimer = null;
  }
});
</script>

<template>
  <!-- 初始化失败：致命错误屏幕 -->
  <FatalErrorScreen v-if="state.status === 'fatal_error'" :errors="state.fatalErrors" />

  <!-- 无可用模型供应商提示 -->
  <NoProvidersAvailable v-else-if="state.status === 'no_providers'" />

  <!-- 渲染进度条 UI -->
  <div
    v-else
    class="flex items-center justify-center w-full h-dvh bg-background"
    role="status"
    aria-live="polite"
  >
    <div class="flex flex-col items-center gap-8 w-80">
      <!-- Logo 动画 - 与进度条对齐（不包括百分比） -->
      <div class="w-full pr-10 flex justify-center">
        <AnimatedLogo />
      </div>

      <!-- 进度条和百分比 -->
      <div class="w-full flex items-center gap-3">
        <Progress :value="progress" class="h-2 flex-1" />
        <span class="text-sm text-muted-foreground w-10 text-right">
          {{ progress }}%
        </span>
      </div>

      <!-- 动态加载文本 - 与进度条对齐（不包括百分比） -->
      <div class="w-full pr-10 text-center">
        <p class="text-muted-foreground">
          Initializing application{{ dots }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 初始化控制器组件（Vue 版）
 *
 * 职责：执行初始化、更新进度、返回初始化结果（成功/失败/警告）
 * 不处理 Toast、安全警告等副作用（由父组件 App 处理）
 * 行为与 React 版 InitializationController 保持一致
 */
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { Progress } from '@/components/ui-vue/progress';
import FatalErrorScreen from '@/components/FatalErrorScreen.vue';
import NoProvidersAvailable from '@/components/NoProvidersAvailable.vue';
import AnimatedLogo from '@/components/AnimatedLogo/AnimatedLogo.vue';
import { InitializationManager } from '@/services/initialization';
import type { InitResult, InitError, InitStep } from '@/services/initialization';

const props = defineProps<{
  /** 初始化步骤列表（由外部传入，实现依赖注入） */
  initSteps: InitStep[];
}>();

const emit = defineEmits<{
  (e: 'complete', result: InitResult): void;
}>();

/**
 * 初始化状态
 */
const state = reactive({
  /** 当前状态：初始化中 | 成功 | 致命错误 | 无可用供应商 */
  status: 'initializing' as 'initializing' | 'success' | 'fatal_error' | 'no_providers',
  /** 当前完成的步骤数（初始值为 0，确保进度条从 0% 开始） */
  currentStep: 0,
  /** 总步骤数 */
  totalSteps: props.initSteps.length,
  /** 致命错误列表 */
  fatalErrors: [] as InitError[],
  /** 警告列表 */
  warnings: [] as InitError[],
  /** 是否准备好进入主应用（成功后延迟 500ms） */
  readyToProceed: false,
});

/** 动态三个点动画状态 */
const dots = ref('');

/** 动态三个点动画定时器（. → .. → ... 循环） */
let dotsTimer: ReturnType<typeof setInterval> | null = null;
let proceedTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  // 动态三个点动画
  dotsTimer = setInterval(() => {
    dots.value = dots.value.length >= 5 ? '' : dots.value + '.';
  }, 200);

  // 执行初始化
  void runInit();
});

onUnmounted(() => {
  if (dotsTimer) clearInterval(dotsTimer);
  if (proceedTimer) clearTimeout(proceedTimer);
});

/**
 * 执行初始化
 */
const runInit = async () => {
  const manager = new InitializationManager();
  const result = await manager.runInitialization({
    steps: props.initSteps,
    onProgress: (current, total, _currentStep) => {
      // 更新进度
      state.currentStep = current;
      state.totalSteps = total;
    },
  });

  if (!result.success) {
    // 初始化失败，显示致命错误屏幕
    state.status = 'fatal_error';
    state.fatalErrors = result.fatalErrors;
    return;
  }

  // 从 result 中检查 modelProvider 状态（解耦 store 依赖）
  const modelProviderStatus = result.modelProviderStatus;

  // 检查是否应该显示"无可用的模型供应商"错误提示
  if (modelProviderStatus?.isNoProvidersError === true) {
    state.status = 'no_providers';
    return;
  }

  // 初始化成功，等待 500ms 延迟
  state.status = 'success';
  state.warnings = result.warnings;
};

// 初始化完成后 500ms 延迟，再通知父组件
watch(
  () => state.status,
  (status) => {
    if (status === 'success' && !state.readyToProceed) {
      proceedTimer = setTimeout(() => {
        state.readyToProceed = true;
      }, 500);
    }
  },
);

watch(
  () => state.readyToProceed,
  (ready) => {
    if (ready && state.status === 'success') {
      emit('complete', {
        success: true,
        fatalErrors: [],
        warnings: state.warnings,
        ignorableErrors: [],
        completedSteps: [],
      });
    }
  },
);

// 计算进度百分比
const progress = Math.round((state.currentStep / state.totalSteps) * 100);
</script>

<template>
  <!-- 渲染错误状态 -->
  <FatalErrorScreen v-if="state.status === 'fatal_error'" :errors="state.fatalErrors" />
  <NoProvidersAvailable v-else-if="state.status === 'no_providers'" />

  <!-- 渲染进度条 UI -->
  <div
    v-else
    class="flex h-dvh w-full items-center justify-center bg-background"
    role="status"
    aria-live="polite"
  >
    <div class="flex w-80 flex-col items-center gap-8">
      <!-- Logo 动画 - 与进度条对齐（不包括百分比） -->
      <div class="flex w-full justify-center pr-10">
        <AnimatedLogo />
      </div>

      <!-- 进度条和百分比 -->
      <div class="flex w-full items-center gap-3">
        <Progress :model-value="progress" class="h-2 flex-1" />
        <span class="w-10 text-right text-sm text-muted-foreground">
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

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Progress } from '@/components/ui/progress';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import NoProvidersAvailable from '@/components/NoProvidersAvailable.vue';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { InitializationManager } from '@/services/initialization';
import type { InitResult, InitError, InitStep } from '@/services/initialization';

/**
 * 初始化控制器组件属性
 */
interface InitializationControllerProps {
  /** 初始化步骤列表（由外部传入，实现依赖注入） */
  initSteps: InitStep[];
}

const props = defineProps<InitializationControllerProps>();

const emit = defineEmits<{
  /** 初始化完成回调 */
  (e: 'complete', result: InitResult): void;
}>();

/** 控制器状态：初始化中 | 成功 | 致命错误 | 无可用供应商 */
type ControllerStatus = 'initializing' | 'success' | 'fatal_error' | 'no_providers';

/** 当前状态 */
const status = ref<ControllerStatus>('initializing');
/** 当前完成的步骤数（初始值为 0，确保进度条从 0% 开始） */
const currentStep = ref(0);
/** 总步骤数 */
const totalSteps = ref(props.initSteps.length);
/** 致命错误列表 */
const fatalErrors = ref<InitError[]>([]);
/** 警告列表 */
const warnings = ref<InitError[]>([]);
/** 是否准备好进入主应用（成功后延迟 500ms） */
const readyToProceed = ref(false);

/** 动态三个点动画文本 */
const dots = ref('');
/** dots 动画定时器 */
let dotsTimer: ReturnType<typeof setInterval> | null = null;
/** 成功延迟定时器 */
let proceedTimer: ReturnType<typeof setTimeout> | null = null;

/** 进度百分比 */
const progress = computed(() =>
  Math.round((currentStep.value / totalSteps.value) * 100),
);

/**
 * 执行初始化流程
 */
async function runInit(): Promise<void> {
  const manager = new InitializationManager();
  const result = await manager.runInitialization({
    steps: props.initSteps,
    onProgress: (current, total) => {
      // 更新进度
      currentStep.value = current;
      totalSteps.value = total;
    },
  });

  if (!result.success) {
    // 初始化失败，显示致命错误屏幕
    status.value = 'fatal_error';
    fatalErrors.value = result.fatalErrors;
    return;
  }

  // 检查是否应该显示"无可用的模型供应商"错误提示（解耦 store 依赖）
  if (result.modelProviderStatus?.isNoProvidersError === true) {
    status.value = 'no_providers';
    return;
  }

  // 初始化成功，等待 500ms 延迟后进入主应用
  status.value = 'success';
  warnings.value = result.warnings;
  proceedTimer = setTimeout(() => {
    readyToProceed.value = true;
  }, 500);
}

// dots 动画：. → .. → ... 循环，每 200ms 更新（仅初始化中显示）
watch(
  status,
  (value) => {
    if (value === 'initializing') {
      dotsTimer = setInterval(() => {
        dots.value = dots.value.length >= 5 ? '' : dots.value + '.';
      }, 200);
    } else if (dotsTimer) {
      clearInterval(dotsTimer);
      dotsTimer = null;
    }
  },
  { immediate: true },
);

// 初始化完成后 500ms 延迟通知父组件
watch(readyToProceed, (value) => {
  if (value && status.value === 'success') {
    emit('complete', {
      success: true,
      fatalErrors: [],
      warnings: warnings.value,
      ignorableErrors: [],
      completedSteps: [],
    });
  }
});

onMounted(() => {
  runInit();
});

onBeforeUnmount(() => {
  if (dotsTimer) clearInterval(dotsTimer);
  if (proceedTimer) clearTimeout(proceedTimer);
});
</script>

<!--
  初始化控制器组件
  职责：执行初始化、更新进度、返回初始化结果（成功/失败/警告）
  不处理 Toast、安全警告等副作用（由父组件处理）
-->
<template>
  <FatalErrorScreen v-if="status === 'fatal_error'" :errors="fatalErrors" />

  <NoProvidersAvailable v-else-if="status === 'no_providers'" />

  <!-- 进度条 UI -->
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
        <Progress :model-value="progress" class="h-2 flex-1" />
        <span class="text-sm text-muted-foreground w-10 text-right">
          {{ progress }}%
        </span>
      </div>

      <!-- 动态加载文本 - 与进度条对齐（不包括百分比） -->
      <div class="w-full pr-10 text-center">
        <p class="text-muted-foreground">Initializing application{{ dots }}</p>
      </div>
    </div>
  </div>
</template>

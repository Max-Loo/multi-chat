<script setup lang="ts">
/**
 * 初始化控制器组件（对应旧版 InitializationController/index.tsx）
 *
 * 职责：执行初始化、更新进度、返回初始化结果（成功/失败/警告）
 * 不处理 Toast、安全警告等副作用（由父组件处理）
 */
import { computed, onUnmounted, ref, watch } from 'vue';
import { Progress } from '@/components/ui/progress';
import FatalErrorScreen from '@/components/FatalErrorScreen/FatalErrorScreen.vue';
import NoProvidersAvailable from '@/components/NoProvidersAvailable/NoProvidersAvailable.vue';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { InitializationManager } from '@/services/initialization';
import type { InitResult, InitError, InitStep } from '@/services/initialization';

/** 组件属性 */
const props = defineProps<{
  /** 初始化步骤列表（由外部传入，实现依赖注入） */
  initSteps: InitStep[];
}>();

/** 初始化完成事件 */
const emit = defineEmits<{
  complete: [result: InitResult];
}>();

/** 初始化状态 */
type InitStatus = 'initializing' | 'success' | 'fatal_error' | 'no_providers';

const status = ref<InitStatus>('initializing');
// 当前完成的步骤数（初始值为 0，确保进度条从 0% 开始）
const currentStep = ref(0);
const totalSteps = ref(props.initSteps.length);
const fatalErrors = ref<InitError[]>([]);
const warnings = ref<InitError[]>([]);
// 是否准备好进入主应用（成功后延迟 500ms）
const readyToProceed = ref(false);

// 动态三个点动画状态
const dots = ref('');
let dotsTimer: ReturnType<typeof setInterval> | null = null;

// 动态三个点动画（. → .. → ... 循环）
if (status.value === 'initializing') {
  dotsTimer = setInterval(() => {
    dots.value = dots.value.length >= 5 ? '' : dots.value + '.';
  }, 200);
}

onUnmounted(() => {
  if (dotsTimer) clearInterval(dotsTimer);
});

// 进度百分比
const progress = computed(() =>
  Math.round((currentStep.value / totalSteps.value) * 100),
);

/** 执行初始化 */
const runInit = async (): Promise<void> => {
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
  } else {
    // 从 result 中检查 modelProvider 状态（解耦 store 依赖）
    const modelProviderStatus = result.modelProviderStatus;
    const shouldShowNoProvidersError =
      modelProviderStatus?.isNoProvidersError === true;

    if (shouldShowNoProvidersError) {
      // 显示无可用模型供应商提示
      status.value = 'no_providers';
    } else {
      // 初始化成功，保存警告并等待 500ms 延迟
      status.value = 'success';
      warnings.value = result.warnings;
      setTimeout(() => {
        readyToProceed.value = true;
      }, 500);
    }
  }
};

// readyToProceed 后通知父组件
watch(
  [readyToProceed, status],
  () => {
    if (readyToProceed.value && status.value === 'success') {
      emit('complete', {
        success: true,
        fatalErrors: [],
        warnings: warnings.value,
        ignorableErrors: [],
        completedSteps: [],
      });
    }
  },
  { immediate: true },
);

// 启动初始化
void runInit();
</script>

<template>
  <!-- 渲染错误状态 -->
  <FatalErrorScreen v-if="status === 'fatal_error'" :errors="fatalErrors" />
  <NoProvidersAvailable v-else-if="status === 'no_providers'" />

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
        <p class="text-muted-foreground">Initializing application{{ dots }}</p>
      </div>
    </div>
  </div>
</template>

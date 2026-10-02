<script setup lang="ts">
/**
 * 应用根组件（对应旧版 main.tsx 中的 App 组件）
 *
 * 管理加载流程四阶段：
 * HTML Spinner → initSteps 加载 → 初始化动画（InitializationController）→ 主应用（MainApp）
 */
import { defineAsyncComponent, ref } from 'vue';
import { InitializationController } from '@/components/InitializationController';
import type { InitResult, InitStep } from '@/services/initialization';

// 主应用组件（动态加载）
const MainApp = defineAsyncComponent({
  loader: () => import('./MainApp.vue'),
});

/** 组件属性：初始化步骤（由 main.ts 顶层 await 加载后传入） */
const props = defineProps<{ initSteps: InitStep[] }>();

// 应用状态：loading → initializing → ready
const appState = ref<'loading' | 'initializing' | 'ready'>('initializing');
// 初始化结果（完成后传给 MainApp）
const initResult = ref<InitResult | null>(null);
// 错误状态
const error = ref<{ message: string; phase: 'initsteps' | 'mainapp' } | null>(
  null,
);

/**
 * 阶段 4：初始化完成后动态加载主应用
 */
const handleInitComplete = async (result: InitResult): Promise<void> => {
  try {
    initResult.value = result;
    appState.value = 'ready';
  } catch (err) {
    console.error(err);
    error.value = {
      message: '应用加载失败，请检查网络连接',
      phase: 'mainapp',
    };
  }
};

/** 重试加载（刷新页面） */
const handleRetry = (): void => {
  window.location.reload();
};

void props;
</script>

<template>
  <!-- 错误状态：显示错误提示界面 -->
  <div v-if="error" class="flex h-dvh w-full items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-4 text-center">
      <p class="text-lg text-foreground">{{ error.message }}</p>
      <button
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        @click="handleRetry"
      >
        重试
      </button>
    </div>
  </div>

  <!-- 阶段 3：初始化中，显示初始化动画 -->
  <InitializationController
    v-else-if="appState === 'initializing'"
    :init-steps="initSteps"
    @complete="handleInitComplete"
  />

  <!-- 阶段 4：初始化完成，渲染主应用 -->
  <Suspense v-else-if="appState === 'ready'">
    <MainApp v-if="initResult" :result="initResult" />
    <template #fallback>
      <div class="flex h-dvh w-full items-center justify-center bg-background" />
    </template>
  </Suspense>
</template>

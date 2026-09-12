<script setup lang="ts">
/**
 * 应用根组件（Vue 版）
 * 管理加载流程：HTML Spinner → 初始化动画 → 主应用
 * 行为与 迁移前 main.tsx 中的 App 组件保持一致
 */
import { ref, onMounted, defineAsyncComponent } from 'vue';
import './main.css';
import { interceptClickAToJump } from '@/services/global';
import InitializationControllerVue from '@/components/InitializationController.vue';
import { Toaster } from '@/components/ui-vue/sonner';
import type { InitResult, InitStep } from '@/services/initialization';

// 应用状态：loading → initializing → ready
const appState = ref<'loading' | 'initializing' | 'ready'>('loading');
// initSteps 模块
const initSteps = ref<InitStep[] | null>(null);
// 主应用组件（初始化完成后动态加载）
const MainAppComponent = defineAsyncComponent(() => import('@/MainAppVue').then((m) => m.createMainApp(initResult.value!)));
// 错误状态
const error = ref<{ message: string; phase: 'initsteps' | 'mainapp' } | null>(null);
// 初始化结果（用于创建主应用）
const initResult = ref<InitResult | null>(null);

onMounted(async () => {
  // 阶段 1-2：异步加载 initSteps（不能使用顶层 await，否则 async setup 组件在没有
  // Suspense 边界的情况下不会被渲染，导致页面空白）
  const initStepsModule = await import('@/config/initSteps');
  initSteps.value = initStepsModule.initSteps;
  appState.value = 'initializing';

  // 全局外链跳转拦截（与 迁移前入口行为一致）
  interceptClickAToJump();
});

/**
 * 阶段 4：初始化完成后动态加载主应用
 */
const handleInitComplete = async (result: InitResult) => {
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

/** 重试加载：刷新页面重试 */
const handleRetry = () => {
  window.location.reload();
};
</script>

<template>
  <!-- 错误状态：显示错误提示界面 -->
  <div v-if="error" class="flex h-dvh w-full items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-4 text-center">
      <p class="text-lg text-foreground">{{ error.message }}</p>
      <button
        class="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        @click="handleRetry"
      >
        重试
      </button>
    </div>
  </div>

  <!-- 阶段 1-2：initSteps 加载中，继续显示 HTML Spinner -->
  <template v-else-if="appState === 'loading' || !initSteps">
    <span />
  </template>

  <!-- 阶段 3：初始化中，显示初始化动画 -->
  <InitializationControllerVue
    v-else-if="appState === 'initializing'"
    :init-steps="initSteps"
    @complete="handleInitComplete"
  />

  <!-- 阶段 4：初始化完成，渲染主应用 -->
  <template v-else>
    <MainAppComponent v-if="appState === 'ready'" />
    <Toaster />
  </template>
</template>

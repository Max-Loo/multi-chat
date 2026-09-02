<script setup lang="ts">
import { getCurrentInstance, ref, type Component } from "vue";
import { InitializationController } from "@/components/InitializationController";
import type { InitResult, InitStep } from "@/services/initialization";

/**
 * 应用主组件
 * 管理加载流程：HTML Spinner → 初始化动画 → 主应用
 */

// 捕获应用实例，用于在主应用加载完成后安装路由
const appInstance = getCurrentInstance()?.appContext.app ?? null;

/**
 * 应用属性
 */
interface Props {
  /** 初始化步骤列表（由 main.ts 顶层 await 加载后注入） */
  initSteps: InitStep[];
}

const props = defineProps<Props>();

// 应用状态：initializing → ready（loading 阶段由 HTML Spinner 兜底，不渲染内容）
const appState = ref<"initializing" | "ready">("initializing");
// 主应用组件（动态加载）
const mainAppComponent = ref<Component | null>(null);
// 错误状态
const error = ref<{ message: string; phase: "mainapp" } | null>(null);

/**
 * 阶段 4：初始化完成后动态加载主应用
 */
async function handleInitComplete(result: InitResult): Promise<void> {
  try {
    const { createMainApp } = await import("@/MainApp");

    // 安装路由（Router 模块随主应用按需加载，维持动态分包策略）
    if (appInstance) {
      const { default: router } = await import("@/router");
      if (!appInstance.config.globalProperties.$router) {
        appInstance.use(router);
      }
    }

    mainAppComponent.value = createMainApp(result);
    appState.value = "ready";
  } catch (err) {
    console.error(err);
    error.value = {
      message: "应用加载失败，请检查网络连接",
      phase: "mainapp",
    };
  }
}

/**
 * 重试加载：刷新页面重试
 */
function handleRetry(): void {
  window.location.reload();
}

// 未使用的 props 解构提示（模板中直接使用 initSteps）
void props;
</script>

<template>
  <!-- 错误状态：显示错误提示界面 -->
  <div v-if="error" class="flex items-center justify-center w-full h-dvh bg-background">
    <div class="flex flex-col items-center gap-4 text-center">
      <p class="text-lg text-foreground">{{ error.message }}</p>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
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
    :on-complete="handleInitComplete"
  />

  <!-- 阶段 4：初始化完成，渲染主应用 -->
  <component
    :is="mainAppComponent"
    v-else-if="appState === 'ready' && mainAppComponent"
  />
</template>

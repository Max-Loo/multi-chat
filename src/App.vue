<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';
import { InitializationController } from '@/components/InitializationController';
import type { InitResult, InitStep } from '@/services/initialization';

/**
 * 应用根组件
 *
 * 管理启动阶段：初始化动画（InitializationController）→ 主应用（MainApp 按需加载）
 */
const props = defineProps<{
  /** 初始化步骤列表（由 main.ts 异步加载后注入） */
  initSteps: InitStep[];
}>();

// 主应用按需加载：初始化完成前不下载主包代码
const MainApp = defineAsyncComponent(() => import('@/components/MainApp.vue'));

/** 当前启动阶段：初始化中 | 就绪 */
const phase = ref<'initializing' | 'ready'>('initializing');
/** 初始化结果 */
const initResult = ref<InitResult | null>(null);

/**
 * 初始化完成回调：切换到主应用
 * @param result 初始化结果
 */
function handleComplete(result: InitResult): void {
  initResult.value = result;
  phase.value = 'ready';
}
</script>

<template>
  <InitializationController
    v-if="phase === 'initializing'"
    :init-steps="props.initSteps"
    @complete="handleComplete"
  />
  <MainApp v-else-if="initResult" :result="initResult" />
</template>

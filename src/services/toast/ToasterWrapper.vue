<script setup lang="ts">
/**
 * Toaster 包装组件（对应旧版 ToasterWrapper.tsx）
 * - 同步响应式状态到 toastQueue 单例
 * - 确保 isMobile 初始化后再标记就绪，避免竞态条件
 *
 * Vue 版 useMediaQuery 在 setup 时即有确定值（非 undefined），
 * 因此同步后立即标记就绪并触发队列刷新。
 */
import { watch } from 'vue';
import { Toaster } from '@/components/ui/sonner';
import { toastQueue } from './toastQueue';
import { useResponsive } from '@/composables/useResponsive';

const { isMobile } = useResponsive();

// 同步 isMobile 到 toastQueue
watch(
  isMobile,
  (value) => {
    toastQueue.setIsMobile(value);
  },
  { immediate: true },
);

// 就绪后触发队列刷新
toastQueue.markReady();
</script>

<template>
  <Toaster />
</template>

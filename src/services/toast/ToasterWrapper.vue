<script setup lang="ts">
import { ref, watch } from "vue";
import { Toaster } from "@/components/ui/sonner";
import { toastQueue } from "./toastQueue";
import { useResponsive } from "@/composables/useResponsive";

/**
 * Toaster 包装组件（对应原 ToasterWrapper.tsx）
 * - 同步响应式状态到 toastQueue 单例
 * - 确保 isMobile 初始化后再标记就绪，避免竞态条件
 */
const { isMobile } = useResponsive();
const isReady = ref(false);

// 同步 isMobile 到 toastQueue，并确定是否就绪
watch(
  isMobile,
  (value) => {
    if (value === undefined) return;
    toastQueue.setIsMobile(value);
    // 只在 isMobile 确定后才标记就绪
    isReady.value = true;
  },
  { immediate: true },
);

// 就绪后触发队列刷新
watch(
  isReady,
  (ready) => {
    if (ready) {
      toastQueue.markReady();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Toaster />
</template>

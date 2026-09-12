<script setup lang="ts">
/**
 * 全局通知容器（vue-sonner 版）
 * 与 React 版 ui/sonner.tsx 行为一致：跟随主题、固定位置与偏移
 */
import { onMounted } from 'vue';
import { Toaster as VueSonnerToaster } from 'vue-sonner';
import { useTheme, type Theme } from '@/composables/useTheme';
import { toastQueue } from '@/services/toast';

const { theme } = useTheme();

// Toaster 挂载后标记 toast 队列就绪，刷新初始化阶段排队的消息
// （缺少此调用会导致所有 await toastQueue.* 的 UI 操作永久挂起，如语言切换）
onMounted(() => {
  toastQueue.markReady();
});
</script>

<template>
  <VueSonnerToaster
    :theme="theme as Theme"
    position="bottom-right"
    :offset="{ bottom: 24, right: 24 }"
    class="toaster group"
    :toast-options="{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
  />
</template>

<script setup lang="ts">
/**
 * 全局通知容器（vue-sonner 版）
 * 与 React 版 ui/sonner.tsx 行为一致：跟随主题、固定位置与偏移
 */
import { Toaster as VueSonnerToaster } from 'vue-sonner';
import { useTheme, type Theme } from '@/composables/useTheme';

const { theme } = useTheme();
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

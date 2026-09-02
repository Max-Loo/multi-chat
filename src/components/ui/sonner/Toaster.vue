<script setup lang="ts">
import { Toaster as SonnerToaster } from "vue-sonner";
import { useThemeManager } from "@/composables/useTheme";

/**
 * Toast 渲染容器组件（对应原 sonner.tsx）
 * 主题跟随系统主题管理器（useDark，兼容 next-themes 存储键）
 */
const { theme } = useThemeManager();
</script>

<template>
  <SonnerToaster
    :theme="theme"
    position="bottom-right"
    :swipe-directions="['right']"
    :offset="{ bottom: 24, right: 24 }"
    class="toaster group"
    :toast-options="{
      classes: {
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

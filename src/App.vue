<script setup lang="ts">
/**
 * 应用根组件（Vue 版）
 * 挂载全局布局、路由视图与全局通知容器
 */
import { Toaster } from '@/components/ui-vue/sonner';
</script>

<template>
  <router-view />
  <Toaster />
</template>

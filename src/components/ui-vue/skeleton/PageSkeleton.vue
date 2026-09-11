<script setup lang="ts">
/**
 * 页面级骨架屏组件（Vue 版 PageSkeleton）
 * 用于 Layout 的 Suspense fallback，根据设备类型渲染不同布局
 */
import Skeleton from './Skeleton.vue';
import { useResponsive } from '@/composables/useResponsive';

const { isMobile } = useResponsive();
</script>

<template>
  <!-- 移动端布局：主内容区域 + 底部导航占位 -->
  <div v-if="isMobile" class="flex h-screen flex-col bg-white" aria-hidden="true">
    <div class="flex-1 space-y-6 overflow-hidden p-6" aria-hidden="true">
      <div class="space-y-2">
        <Skeleton variant="text" class="h-8 w-1/3" />
        <Skeleton variant="text" class="h-4 w-1/2" />
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton variant="rect" class="h-32" />
        <Skeleton variant="rect" class="h-32" />
        <Skeleton variant="rect" class="h-32" />
      </div>
      <div class="space-y-3">
        <Skeleton variant="text" class="h-12 w-full" />
        <Skeleton variant="text" class="h-12 w-full" />
        <Skeleton variant="text" class="h-12 w-full" />
        <Skeleton variant="text" class="h-12 w-full" />
      </div>
    </div>
    <div data-testid="mobile-bottom-nav-placeholder" class="h-16 shrink-0 border-t border-gray-200 bg-gray-50" />
  </div>

  <!-- 桌面端布局：侧边栏 + 主内容区域 -->
  <div v-else class="flex h-screen bg-white" aria-hidden="true">
    <div data-testid="sidebar-skeleton" class="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
      <div class="h-12 w-full border-b border-gray-100 p-2">
        <Skeleton variant="text" class="h-full w-full" />
      </div>
      <div class="w-full space-y-2 overflow-hidden p-2">
        <Skeleton v-for="index in 8" :key="index" variant="text" class="h-11 w-full" />
      </div>
    </div>
    <div class="flex-1 space-y-6 overflow-hidden p-6" aria-hidden="true">
      <div class="space-y-2">
        <Skeleton variant="text" class="h-8 w-1/3" />
        <Skeleton variant="text" class="h-4 w-1/2" />
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton variant="rect" class="h-32" />
        <Skeleton variant="rect" class="h-32" />
        <Skeleton variant="rect" class="h-32" />
      </div>
      <div class="space-y-3">
        <Skeleton variant="text" class="h-12 w-full" />
        <Skeleton variant="text" class="h-12 w-full" />
        <Skeleton variant="text" class="h-12 w-full" />
        <Skeleton variant="text" class="h-12 w-full" />
      </div>
    </div>
  </div>
</template>

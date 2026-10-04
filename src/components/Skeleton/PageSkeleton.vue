<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';
import { useResponsive } from '@/composables/useResponsive';

/**
 * 页面级骨架屏组件
 *
 * 用于 Layout 的 Suspense fallback，根据设备类型渲染不同布局：
 * 模拟 ChatSidebar（工具栏 + 列表项）与主内容（标题 + 卡片 + 列表）的结构
 */
const { isMobile } = useResponsive();
</script>

<template>
  <!-- 移动端布局：主内容区域 + 底部导航占位 -->
  <div v-if="isMobile" class="flex flex-col h-screen bg-white" aria-hidden="true">
    <div class="flex-1 h-full p-6 space-y-6 overflow-hidden">
      <!-- 页面标题区域 -->
      <div class="space-y-2">
        <Skeleton class="w-1/3 h-8" />
        <Skeleton class="w-1/2 h-4" />
      </div>
      <!-- 内容卡片区域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton v-for="i in 3" :key="i" class="h-32" />
      </div>
      <!-- 列表区域 -->
      <div class="space-y-3">
        <Skeleton v-for="i in 4" :key="i" class="w-full h-12" />
      </div>
    </div>
    <div
      class="h-16 bg-gray-50 border-t border-gray-200 shrink-0"
      data-testid="mobile-bottom-nav-placeholder"
    />
  </div>

  <!-- 桌面端布局：侧边栏 + 主内容区域 -->
  <div v-else class="flex h-screen bg-white" aria-hidden="true">
    <!-- 侧边栏骨架：工具栏区域 + 长条形列表项 -->
    <div
      class="flex flex-col w-64 h-full bg-gray-50 border-r border-gray-200"
      data-testid="sidebar-skeleton"
    >
      <div class="w-full h-12 p-2 border-b border-gray-100">
        <Skeleton class="w-full h-full" />
      </div>
      <div class="w-full p-2 space-y-2 overflow-hidden">
        <Skeleton v-for="i in 8" :key="i" class="h-11 w-full" />
      </div>
    </div>

    <!-- 主内容骨架 -->
    <div class="flex-1 h-full p-6 space-y-6 overflow-hidden">
      <div class="space-y-2">
        <Skeleton class="w-1/3 h-8" />
        <Skeleton class="w-1/2 h-4" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton v-for="i in 3" :key="i" class="h-32" />
      </div>
      <div class="space-y-3">
        <Skeleton v-for="i in 4" :key="i" class="w-full h-12" />
      </div>
    </div>
  </div>
</template>

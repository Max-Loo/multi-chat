<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 主内容区域骨架屏组件
 *
 * 模拟页面主内容的加载状态
 */
</script>

<template>
  <div class="flex-1 h-full p-6 space-y-6 overflow-hidden" aria-hidden="true">
    <!-- 页面标题区域 -->
    <div class="space-y-2">
      <Skeleton variant="text" class="w-1/3 h-8" />
      <Skeleton variant="text" class="w-1/2 h-4" />
    </div>

    <!-- 内容卡片区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton variant="rect" class="h-32" />
      <Skeleton variant="rect" class="h-32" />
      <Skeleton variant="rect" class="h-32" />
    </div>

    <!-- 列表区域 -->
    <div class="space-y-3">
      <Skeleton variant="text" class="w-full h-12" />
      <Skeleton variant="text" class="w-full h-12" />
      <Skeleton variant="text" class="w-full h-12" />
      <Skeleton variant="text" class="w-full h-12" />
    </div>
  </div>
</template>

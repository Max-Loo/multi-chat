<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 侧边栏骨架屏组件
 *
 * 模拟 ChatSidebar 的结构：顶部工具栏区域 + 长条形列表项
 */
</script>

<template>
  <div
    data-testid="sidebar-skeleton"
    class="flex flex-col w-64 h-full bg-gray-50 border-r border-gray-200"
    aria-hidden="true"
  >
    <!-- 顶部工具栏区域 -->
    <div class="w-full h-12 p-2 border-b border-gray-100">
      <Skeleton variant="text" class="w-full h-full" />
    </div>

    <!-- 列表区域 - 长条形按钮样式 -->
    <div class="w-full p-2 space-y-2 overflow-hidden">
      <Skeleton
        v-for="index in 8"
        :key="index"
        variant="text"
        class="h-11 w-full"
      />
    </div>
  </div>
</template>

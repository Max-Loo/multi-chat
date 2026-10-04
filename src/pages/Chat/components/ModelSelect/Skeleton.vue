<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ModelSelect 组件的骨架屏
 *
 * 注意：此骨架屏应与 ModelSelect 组件的布局保持同步
 */
</script>

<template>
  <div class="flex flex-col w-full h-full" aria-hidden="true">
    <!-- 顶部操作栏骨架屏（高度 h-12） -->
    <div class="flex justify-between w-full h-12 pl-4 pr-4 border-b">
      <!-- 左侧区域：已选模型标签预览 -->
      <div class="flex flex-wrap items-center justify-start h-full gap-2">
        <Skeleton class="h-6 w-16 rounded-full" />
        <Skeleton class="h-6 w-20 rounded-full" />
        <Skeleton class="h-6 w-24 rounded-full" />
      </div>

      <!-- 右侧区域：确认按钮和搜索框 -->
      <div class="flex items-center justify-end h-full gap-2">
        <Skeleton class="h-8 w-16 rounded-md" />
        <Skeleton class="h-8 w-72 rounded-md" />
      </div>
    </div>

    <!-- 数据表格区域骨架屏 -->
    <div class="flex flex-col w-full p-4 gap-2">
      <div v-for="i in 5" :key="i" class="flex items-center w-full gap-2">
        <Skeleton class="h-4 w-4" />
        <Skeleton class="h-10 flex-1" />
        <Skeleton class="h-10 flex-1" />
        <Skeleton class="h-10 flex-1" />
        <Skeleton class="h-10 flex-1" />
      </div>
    </div>
  </div>
</template>

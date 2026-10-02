<script setup lang="ts">
/**
 * ModelSelect 组件的骨架屏（对应旧版 ModelSelect/Skeleton.tsx）
 * 布局需与 ModelSelect 保持同步
 */
import { Skeleton } from '@/components/ui/skeleton';
</script>

<template>
  <div class="flex h-full w-full flex-col" aria-hidden="true">
    <!-- 顶部操作栏骨架屏（高度 h-12） -->
    <div class="flex h-12 w-full justify-between border-b pl-4 pr-4">
      <div class="flex h-full flex-wrap items-center justify-start gap-2">
        <Skeleton class="h-6 w-16 rounded-full" />
        <Skeleton class="h-6 w-20 rounded-full" />
        <Skeleton class="h-6 w-24 rounded-full" />
      </div>
      <div class="flex h-full items-center justify-end gap-2">
        <Skeleton class="h-8 w-16 rounded-md" />
        <Skeleton class="h-8 w-72 rounded-md" />
      </div>
    </div>

    <!-- 数据表格区域骨架屏 -->
    <div class="flex w-full flex-col gap-2 p-4">
      <div v-for="i in 5" :key="i" class="flex w-full items-center gap-2">
        <Skeleton class="h-4 w-4" />
        <Skeleton class="h-10 flex-1" />
        <Skeleton class="h-10 flex-1" />
        <Skeleton class="h-10 flex-1" />
        <Skeleton class="h-10 flex-1" />
      </div>
    </div>
  </div>
</template>

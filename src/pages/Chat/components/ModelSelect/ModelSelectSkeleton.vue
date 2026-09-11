<script setup lang="ts">
/**
 * ModelSelect 组件的骨架屏（Vue 版）
 * 注意：此骨架屏应与 ModelSelect 组件的布局保持同步
 */
import Skeleton from '@/components/ui-vue/skeleton/Skeleton.vue';
</script>

<template>
  <div class="flex h-full w-full flex-col" aria-hidden="true">
    <!-- 顶部操作栏骨架屏（高度 h-12） -->
    <div class="flex h-12 w-full justify-between border-b pl-4 pr-4">
      <!-- 左侧区域：已选模型标签预览 -->
      <div class="flex h-full flex-wrap items-center justify-start gap-2">
        <Skeleton class="h-6 w-16 rounded-full" />
        <Skeleton class="h-6 w-20 rounded-full" />
        <Skeleton class="h-6 w-24 rounded-full" />
      </div>

      <!-- 右侧区域：确认按钮和搜索框 -->
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

<script setup lang="ts">
/**
 * Panel 组件的骨架屏（Vue 版）
 * 注意：此骨架屏应与 Panel 组件的布局保持同步
 */
import Skeleton from '@/components/ui-vue/skeleton/Skeleton.vue';

withDefaults(defineProps<{ columnCount?: number }>(), { columnCount: 1 });
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center justify-start" aria-hidden="true">
    <!-- 头部骨架屏（高度 h-12） -->
    <div data-testid="skeleton-header" class="relative z-10 flex h-12 w-full items-center justify-between border-b pl-3 pr-3">
      <!-- 左侧区域：聊天名称 -->
      <div class="flex items-center justify-start">
        <Skeleton class="h-5 w-32" />
      </div>

      <!-- 右侧区域：列数控制（仅在多列时显示） -->
      <div v-if="columnCount > 1" data-testid="skeleton-column-control" class="flex items-center justify-start gap-2 text-sm">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-5 w-11" />
        <Skeleton class="h-4 w-16" />
        <Skeleton class="h-8 w-16" />
        <Skeleton class="h-4 w-4" />
        <Skeleton class="h-8 w-8 rounded-md" />
        <Skeleton class="h-8 w-8 rounded-md" />
      </div>
    </div>

    <!-- 聊天内容区域骨架屏（flex-grow） -->
    <div class="flex w-full grow flex-col" />

    <!-- 内容区域：多列消息气泡骨架屏 -->
    <div
      data-testid="skeleton-message-grid"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        gap: '1rem',
      }"
    >
      <div v-for="columnIndex in columnCount" :key="columnIndex" class="flex h-full w-full flex-col gap-3">
        <!-- 模拟 2-3 个消息气泡 -->
        <div v-for="i in 3" :key="i" class="flex flex-col gap-2">
          <!-- 用户消息气泡（右侧对齐） -->
          <div v-if="i % 2 === 0" data-testid="skeleton-bubble-right" class="flex justify-end">
            <Skeleton class="h-12 rounded-lg" :style="{ width: `${60 + (columnIndex - 1) * 10}%` }" />
          </div>
          <!-- AI 消息气泡（左侧对齐） -->
          <div v-else data-testid="skeleton-bubble-left" class="flex justify-start">
            <Skeleton class="h-16 rounded-lg" :style="{ width: `${70 + (columnIndex - 1) * 5}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- 发送框区域骨架屏 -->
    <div data-testid="skeleton-sender" class="relative z-10 w-full border-t px-4 py-3">
      <div class="relative flex items-end gap-3">
        <Skeleton class="h-20 flex-1 rounded-lg" />
        <Skeleton class="h-10 w-10 shrink-0 rounded-full" />
      </div>
    </div>
  </div>
</template>

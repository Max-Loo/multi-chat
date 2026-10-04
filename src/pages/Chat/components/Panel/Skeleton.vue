<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Panel 组件的骨架屏属性
 */
interface PanelSkeletonProps {
  /** 每行列数 */
  columnCount?: number;
}

const props = withDefaults(defineProps<PanelSkeletonProps>(), {
  columnCount: 1,
});

/** 生成消息气泡骨架的列索引数组 */
const columnIndexes = Array.from({ length: 3 }, (_, i) => i + 1);
</script>

<!--
  Panel 组件的骨架屏
  注意：此骨架屏应与 Panel 组件的布局保持同步
-->
<template>
  <div
    class="relative flex flex-col items-center justify-start w-full h-full"
    aria-hidden="true"
  >
    <!-- 头部骨架屏（高度 h-12） -->
    <div
      data-testid="skeleton-header"
      class="relative z-10 flex items-center justify-between w-full h-12 pl-3 pr-3 border-b"
    >
      <div class="flex items-center justify-start">
        <Skeleton class="h-5 w-32" />
      </div>

      <!-- 右侧区域：列数控制（仅在多列时显示） -->
      <div
        v-if="props.columnCount > 1"
        data-testid="skeleton-column-control"
        class="flex items-center justify-start text-sm gap-2"
      >
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
    <div class="flex flex-col w-full grow" />

    <!-- 内容区域：多列消息气泡骨架屏 -->
    <div
      data-testid="skeleton-message-grid"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${props.columnCount}, minmax(0, 1fr))`,
        gap: '1rem',
      }"
    >
      <div
        v-for="columnIndex in props.columnCount"
        :key="columnIndex"
        class="flex flex-col w-full h-full gap-3"
      >
        <!-- 模拟消息气泡 -->
        <div v-for="i in columnIndexes" :key="i" class="flex flex-col gap-2">
          <!-- 用户消息气泡（右侧对齐） -->
          <div v-if="i % 2 === 0" data-testid="skeleton-bubble-right" class="flex justify-end">
            <Skeleton
              class="h-12 rounded-lg"
              :style="{ width: `${60 + (columnIndex - 1) * 10}%` }"
            />
          </div>
          <!-- AI 消息气泡（左侧对齐） -->
          <div v-else data-testid="skeleton-bubble-left" class="flex justify-start">
            <Skeleton
              class="h-16 rounded-lg"
              :style="{ width: `${70 + (columnIndex - 1) * 5}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 发送框区域骨架屏 -->
    <div data-testid="skeleton-sender" class="relative z-10 w-full px-4 py-3 border-t">
      <div class="relative flex items-end gap-3">
        <Skeleton class="flex-1 h-20 rounded-lg" />
        <Skeleton class="h-10 w-10 rounded-full shrink-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatModel } from '@/types/chat';
import Detail from './Detail/index.vue';

/**
 * 固定网格布局组件属性
 */
interface GridProps {
  /** 二维数组，每行最多 columnCount 个模型 */
  board: ChatModel[][];
}

defineProps<GridProps>();
</script>

<template>
  <div class="absolute top-0 left-0 w-full h-full pt-12 pb-30" data-testid="grid-container">
    <div class="flex flex-col w-full h-full">
      <div
        v-for="(row, idx) in board"
        :key="idx"
        class="flex w-full flex-1 overflow-y-hidden"
        data-testid="grid-row"
      >
        <div
          v-for="(chatModel, cellIdx) in row"
          :key="chatModel.modelId"
          :class="[
            'relative flex-1 min-w-0 border-gray-300',
            cellIdx < row.length - 1 && 'border-r',
            idx < board.length - 1 && 'border-b',
          ]"
        >
          <Detail :chat-model="chatModel" />
        </div>
      </div>
    </div>
  </div>
</template>

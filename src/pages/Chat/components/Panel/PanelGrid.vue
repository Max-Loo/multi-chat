<script setup lang="ts">
/**
 * 固定网格布局组件（Vue 版 PanelGrid）
 * @param board 二维数组，每行最多 columnCount 个模型
 */
import { cn } from '@/utils/utils';
import Detail from './Detail/Detail.vue';

const props = defineProps<{
  board: { modelId: string }[][];
}>();
</script>

<template>
  <div class="absolute left-0 top-0 h-full w-full pt-12 pb-30" data-testid="grid-container">
    <div class="flex h-full w-full flex-col">
      <div
        v-for="(row, idx) in props.board"
        :key="idx"
        class="flex w-full flex-1 overflow-y-hidden"
        data-testid="grid-row"
      >
        <div
          v-for="(chatModel, cellIdx) in row"
          :key="chatModel.modelId"
          :class="cn(
            'relative min-w-0 flex-1 border-gray-300',
            cellIdx < row.length - 1 && 'border-r',
            idx < props.board.length - 1 && 'border-b',
          )"
        >
          <Detail :chat-model="chatModel" />
        </div>
      </div>
    </div>
  </div>
</template>

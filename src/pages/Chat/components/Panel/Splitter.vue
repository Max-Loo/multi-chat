<script setup lang="ts">
import type { ChatModel } from '@/types/chat';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import Detail from './Detail/index.vue';

/**
 * 可拖拽布局组件属性
 */
interface SplitterProps {
  /** 二维数组，每行最多 columnCount 个模型 */
  board: ChatModel[][];
}

defineProps<SplitterProps>();
</script>

<template>
  <div
    class="absolute top-0 left-0 w-full h-full pt-12 pb-30"
    data-testid="splitter-container"
  >
    <ResizablePanelGroup orientation="vertical">
      <template v-for="(row, idx) in board" :key="idx">
        <ResizablePanel :default-size="100 / board.length">
          <ResizablePanelGroup orientation="horizontal">
            <template v-for="(chatModel, cellIdx) in row" :key="chatModel.modelId">
              <ResizablePanel :default-size="100 / row.length">
                <div class="relative h-full w-full">
                  <Detail :chat-model="chatModel" />
                </div>
              </ResizablePanel>
              <ResizableHandle v-if="cellIdx < row.length - 1" with-handle />
            </template>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle v-if="idx < board.length - 1" with-handle />
      </template>
    </ResizablePanelGroup>
  </div>
</template>

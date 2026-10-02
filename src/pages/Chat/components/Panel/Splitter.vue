<script setup lang="ts">
/**
 * 可拖拽布局组件（对应旧版 Panel/Splitter.tsx）
 */
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import Detail from './Detail/Detail.vue';
import type { ChatModel } from '@/types/chat';

defineProps<{ board: ChatModel[][] }>();
</script>

<template>
  <div class="absolute left-0 top-0 h-full w-full pt-12 pb-30" data-testid="splitter-container">
    <ResizablePanelGroup direction="vertical">
      <template v-for="(row, idx) in board" :key="idx">
        <ResizablePanel :default-size="100 / board.length">
          <ResizablePanelGroup direction="horizontal">
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

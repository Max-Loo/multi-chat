<script setup lang="ts">
/**
 * 可拖拽布局组件（Vue 版 PanelSplitter）
 * 基于 reka-ui Splitter 的纵向分组 + 每行横向分组
 */
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui';
import Detail from './Detail/Detail.vue';

const props = defineProps<{
  board: { modelId: string }[][];
}>();
</script>

<template>
  <div class="absolute left-0 top-0 h-full w-full pt-12 pb-30" data-testid="splitter-container">
    <SplitterGroup orientation="vertical">
      <template v-for="(row, idx) in props.board" :key="idx">
        <SplitterPanel :default-size="100 / props.board.length">
          <SplitterGroup orientation="horizontal">
            <template v-for="(chatModel, cellIdx) in row" :key="chatModel.modelId">
              <SplitterPanel :default-size="100 / row.length">
                <div class="relative h-full w-full">
                  <Detail :chat-model="chatModel" />
                </div>
              </SplitterPanel>
              <SplitterResizeHandle v-if="cellIdx < row.length - 1" with-handle />
            </template>
          </SplitterGroup>
        </SplitterPanel>
        <SplitterResizeHandle v-if="idx < props.board.length - 1" with-handle />
      </template>
    </SplitterGroup>
  </div>
</template>

<script setup lang="ts">
/**
 * 聊天面板（Vue 版 Panel 编排）
 * Header（列数/Splitter 控制）+ Grid/Splitter 布局 + Sender
 */
import { ref, watch, defineAsyncComponent } from 'vue';
import { useSelectedChat } from '@/composables/pages/useSelectedChat';
import { useBoard } from '@/composables/pages/useBoard';
import PanelHeader from './PanelHeader.vue';
import PanelSender from './PanelSender.vue';

// Splitter 异步导入：仅在用户启用可拖拽布局时加载
const PanelSplitter = defineAsyncComponent(() => import('./PanelSplitter.vue'));
const PanelGrid = defineAsyncComponent(() => import('./PanelGrid.vue'));

const { chatModelList } = useSelectedChat();

// 控制每一行展示多少个聊天框
const columnCount = ref(chatModelList.value.length);

// 是否启用自定义拖拽窗口
const isSplitter = ref(false);

// 当 chatModelList 变化时重置 isSplitter（避免切到单模型聊天仍保持 Splitter 模式）
watch(chatModelList, () => {
  isSplitter.value = false;
});

// 使用 useBoard 获取布局数据
const { board, shouldUseSplitter } = useBoard(columnCount, isSplitter);
</script>

<template>
  <div class="relative flex h-full w-full flex-col items-center justify-start" data-testid="chat-panel">
    <!-- 布局区域：根据 shouldUseSplitter 显式条件渲染 -->
    <PanelSplitter v-if="shouldUseSplitter" :board="board" />
    <PanelGrid v-else :board="board" />

    <!-- 头部 -->
    <PanelHeader
      :column-count="columnCount"
      :is-splitter="isSplitter"
      @update:column-count="columnCount = $event"
      @update:is-splitter="isSplitter = $event"
    />

    <!-- 内容部分（占位） -->
    <div class="flex w-full grow flex-col" />

    <!-- 发送框 -->
    <div class="w-full p-2">
      <PanelSender />
    </div>
  </div>
</template>

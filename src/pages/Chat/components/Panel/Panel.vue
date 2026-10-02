<script setup lang="ts">
/**
 * 聊天面板组件（对应旧版 Panel/index.tsx）
 * 根据 shouldUseSplitter 在固定网格与可拖拽布局间切换
 */
import { ref, watch, defineAsyncComponent } from 'vue';
import Header from './Header.vue';
import Grid from './Grid.vue';
import Sender from './Sender.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { useSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useBoard } from '@/pages/Chat/composables/useBoard';

// Splitter 组件异步导入（仅在启用可拖拽布局时加载）
const Splitter = defineAsyncComponent(() => import('./Splitter.vue'));

const { chatModelList } = useSelectedChat();

// 控制每一行展示多少个聊天框
const columnCount = ref(chatModelList.value.length);

// 是否启用自定义拖拽窗口
const isSplitter = ref(false);

// 当 chatModelList 变化时重置 isSplitter
// 避免切换到只有 1 个模型的聊天时仍保持 Splitter 模式
watch(chatModelList, () => {
  isSplitter.value = false;
});

// 使用 useBoard 获取布局数据
const { board, shouldUseSplitter } = useBoard(
  () => columnCount.value,
  () => isSplitter.value,
);
</script>

<template>
  <div
    class="relative flex h-full w-full flex-col items-center justify-start"
    data-testid="chat-panel"
  >
    <!-- Splitter 布局 -->
    <Suspense v-if="shouldUseSplitter">
      <Splitter :board="board" />
      <template #fallback>
        <div class="absolute left-0 top-0 h-full w-full pt-12 pb-30">
          <div class="flex h-full w-full flex-col gap-2 p-4">
            <Skeleton
              v-for="(_, idx) in board.flat()"
              :key="idx"
              class="flex-1 rounded-lg"
            />
          </div>
        </div>
      </template>
    </Suspense>
    <!-- 固定网格布局 -->
    <Grid v-else :board="board" />

    <!-- 头部 -->
    <Header
      :column-count="columnCount"
      :is-splitter="isSplitter"
      @update:column-count="(value: number) => (columnCount = value)"
      @update:is-splitter="(value: boolean) => (isSplitter = value)"
    />
    <!-- 内容部分（仅占位） -->
    <div class="flex w-full grow flex-col" />
    <!-- 发送框 -->
    <div class="w-full p-2">
      <Sender />
    </div>
  </div>
</template>

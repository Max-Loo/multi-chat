<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from 'vue';
import Header from './Header.vue';
import Grid from './Grid.vue';
import Sender from './Sender.vue';
import { useBoard } from '@/pages/Chat/composables/useBoard';
import { useChatPageSelectedChat } from '@/pages/Chat/composables/useSelectedChat';

/**
 * Splitter 组件按需加载
 * 仅在用户启用可拖拽布局时加载，减少主 bundle 体积
 */
const Splitter = defineAsyncComponent(() => import('./Splitter.vue'));

/**
 * 聊天面板组件
 */
const { chatModelList } = useChatPageSelectedChat();

// 控制每一行展示多少个聊天框
const columnCount = ref(chatModelList.value.length);

// 是否启用自定义拖拽窗口
const isSplitter = ref(false);

// 当 chatModelList 变化时重置 isSplitter
// 避免切换到只有 1 个模型的聊天时仍保持 Splitter 模式
watch(chatModelList, () => {
  isSplitter.value = false;
});

// 使用 useBoard 组合式函数获取布局数据
const { board, shouldUseSplitter } = useBoard(columnCount, isSplitter);

// 显式条件渲染：根据 shouldUseSplitter 选择组件
// 注意：切换布局会卸载/挂载组件，内部状态（如滚动位置）会丢失
// 如果需要保持状态，应使用 CSS display:none 隐藏而非卸载
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-start w-full h-full"
    data-testid="chat-panel"
  >
    <!-- 为了实现「上中下」的布局，内部采用 absolute 定位，为了保持层级正常，将组件写在最前面 -->
    <Splitter v-if="shouldUseSplitter" :board="board" />
    <Grid v-else :board="board" />

    <!-- 头部 -->
    <Header
      v-model:column-count="columnCount"
      v-model:is-splitter="isSplitter"
    />

    <!-- 内容部分（仅占位） -->
    <div class="flex flex-col w-full grow" />

    <!-- 发送框 -->
    <div class="w-full p-2">
      <Sender />
    </div>
  </div>
</template>

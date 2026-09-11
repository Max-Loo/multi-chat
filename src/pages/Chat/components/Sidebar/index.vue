<script setup lang="ts">
/**
 * 聊天侧边栏组件（Vue 版）
 * 工具栏 + 虚拟滚动的聊天列表（含加载骨架屏），行为与 React 版 Sidebar 保持一致
 */
import { computed, ref } from 'vue';
import { VList } from 'virtua/vue';
import ToolsBar from './components/ToolsBar.vue';
import ChatButton from './components/ChatButton.vue';
import Skeleton from '@/components/ui-vue/skeleton/Skeleton.vue';
import { useChatStore } from '@/store/pinia/chat';
import { useExistingChatList } from '@/composables/useExistingChatList';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';
import type { ChatMeta } from '@/types/chat';

const chatStore = useChatStore();
const chatMetaList = useExistingChatList();
const chatListLoading = computed(() => chatStore.loading);
const selectedChatId = computed(() => chatStore.selectedChatId);

const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

const filterText = ref('');

const filterPredicate = (meta: ChatMeta) =>
  meta.name?.toLocaleLowerCase().includes(filterText.value.toLocaleLowerCase());

const { filteredList: filteredChatList } = useDebouncedFilter(
  filterText,
  chatMetaList,
  filterPredicate,
);
</script>

<template>
  <div data-testid="chat-sidebar" class="relative flex h-full w-full flex-col items-center justify-start">
    <div class="h-12 w-full border-b border-gray-100 p-2">
      <ToolsBar v-model:filter-text="filterText" />
    </div>

    <!-- 列表区域 -->
    <div v-if="!chatListLoading" class="min-h-0 w-full flex-1">
      <VList :data="filteredChatList" :class="`w-full pb-2 ${scrollbarClassname}`" @scroll="onScrollEvent">
        <template #default="{ item }">
          <ChatButton
            :chat-meta="item"
            :is-selected="item.id === selectedChatId"
          />
        </template>
      </VList>
    </div>

    <!-- 加载骨架屏 -->
    <div v-else class="w-full space-y-2 p-2">
      <Skeleton v-for="index in 5" :key="index" class="h-11 w-full" />
    </div>
  </div>
</template>

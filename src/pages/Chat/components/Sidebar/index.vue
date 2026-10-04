<script setup lang="ts">
import { ref, computed } from 'vue';
import { VList } from 'virtua/vue';
import ToolsBar from './components/ToolsBar.vue';
import ChatButton from './components/ChatButton.vue';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatMeta } from '@/types/chat';
import { useChatStore } from '@/store/chat';
import { useExistingChatList } from '@/composables/useExistingChatList';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

/**
 * 聊天侧边栏组件
 */
const chatStore = useChatStore();
const chatMetaList = useExistingChatList();
const chatListLoading = computed(() => chatStore.loading);
const selectedChatId = computed(() => chatStore.selectedChatId);

const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

/** virtua VList 的 scroll 回调（offset 参数未使用） */
function onVirtualizerScroll(_offset: number): void {
  onScrollEvent();
}

/** 过滤文本 */
const filterText = ref('');

/** 按名称过滤聊天 */
const filterPredicate = (meta: ChatMeta) =>
  meta.name?.toLocaleLowerCase().includes(filterText.value.toLocaleLowerCase());

const { filteredList: filteredChatList } = useDebouncedFilter(
  filterText,
  chatMetaList,
  filterPredicate,
);
</script>

<template>
  <div
    data-testid="chat-sidebar"
    class="relative flex flex-col items-center justify-start w-full h-full"
  >
    <div class="w-full h-12 p-2 border-b border-gray-100">
      <ToolsBar v-model:filter-text="filterText" />
    </div>

    <!-- 加载完成：虚拟列表 -->
    <div v-if="!chatListLoading" class="flex-1 min-h-0 w-full">
      <VList
        :data="filteredChatList"
        :class="['pb-2 w-full', scrollbarClassname]"
        :scroll="onVirtualizerScroll"
      >
        <template #default="{ item }">
          <ChatButton
            :key="item.id"
            :chat-meta="item"
            :is-selected="item.id === selectedChatId"
          />
        </template>
      </VList>
    </div>

    <!-- 加载中：骨架屏 -->
    <div v-else class="w-full p-2 space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-11 w-full" />
    </div>
  </div>
</template>

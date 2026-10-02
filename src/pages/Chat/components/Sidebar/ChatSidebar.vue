<script setup lang="ts">
/**
 * 聊天侧边栏组件（对应旧版 pages/Chat/components/Sidebar/index.tsx）
 * 搜索过滤 + 虚拟滚动会话列表
 */
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { VList } from 'virtua/vue';
import ToolsBar from './components/ToolsBar.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useChatStore } from '@/stores';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';
import ChatButton from './components/ChatButton.vue';
import { useExistingChatList } from '@/composables/useExistingChatList';
import type { ChatMeta } from '@/types/chat';

const chatStore = useChatStore();
const { loading: chatListLoading, selectedChatId } = storeToRefs(chatStore);
const chatMetaList = useExistingChatList();

const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

const filterText = ref('');

/** 过滤谓词：按名称模糊匹配 */
const filterPredicate = (meta: ChatMeta): unknown =>
  meta.name?.toLocaleLowerCase().includes(filterText.value.toLocaleLowerCase());

const { filteredList: filteredChatList } = useDebouncedFilter<ChatMeta>(
  () => filterText.value,
  () => chatMetaList.value,
  filterPredicate,
);

// 供模板使用的 computed 别名
const chatList = computed(() => filteredChatList.value);
</script>

<template>
  <div
    data-testid="chat-sidebar"
    class="relative flex h-full w-full flex-col items-center justify-start"
  >
    <div class="h-12 w-full border-b border-gray-100 p-2">
      <ToolsBar
        :filter-text="filterText"
        @update:filter-text="(v: string) => (filterText = v)"
      />
    </div>
    <div v-if="!chatListLoading" class="w-full min-h-0 flex-1">
      <VList
        :class="`w-full pb-2 ${scrollbarClassname}`"
        :data="chatList"
        @scroll="onScrollEvent"
      >
        <template #default="{ item: meta }">
          <ChatButton
            :chat-meta="meta"
            :is-selected="meta.id === selectedChatId"
          />
        </template>
      </VList>
    </div>
    <div v-else class="w-full space-y-2 p-2">
      <Skeleton v-for="index in 5" :key="index" class="h-11 w-full" />
    </div>
  </div>
</template>

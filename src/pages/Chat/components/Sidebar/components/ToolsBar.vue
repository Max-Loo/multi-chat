<script setup lang="ts">
/**
 * 聊天侧边栏工具栏（Vue 版 ToolsBar）
 * 搜索切换、新建聊天、隐藏侧边栏，行为与 React 版 ToolsBar 保持一致
 */
import { computed, ref } from 'vue';
import { ArrowLeft, PanelLeftClose, Plus, Search } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import FilterInput from '@/components/FilterInput.vue';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{
  filterText?: string;
}>();

const emit = defineEmits<{ (e: 'filterChange', value: string): void }>();

const { t } = useTranslation();
const chatPageStore = useChatPageStore();
const { layoutMode } = useResponsive();
const { createNewChat } = useCreateChat();

// Desktop 和 Mobile 模式使用正常尺寸
const isNormalSize = computed(() => layoutMode.value === 'desktop' || layoutMode.value === 'mobile');
// 非 Mobile 模式（Desktop、Compact、Compressed）显示隐藏侧边栏按钮
const isNonMobile = computed(() => layoutMode.value !== 'mobile');

const isShowChatPage = computed(() => chatPageStore.isShowChatPage);

// 是否展示搜索状态
const isSearching = ref(false);

/** 点击返回退出搜索 */
const quitSearch = () => {
  isSearching.value = false;
  emit('filterChange', '');
};

/** 隐藏聊天页侧边栏 */
const collapseSidebar = () => {
  chatPageStore.setIsCollapsed(true);
};
</script>

<template>
  <!-- 搜索状态 -->
  <div v-if="isSearching" class="flex w-full items-center justify-between" data-testid="tools-bar">
    <Button
      variant="ghost"
      :class="`rounded-lg p-1 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
      :aria-label="t('common.search') as string"
      @click="quitSearch"
    >
      <ArrowLeft :size="isNormalSize ? 16 : 15" />
    </Button>
    <FilterInput
      :model-value="props.filterText ?? ''"
      class="ml-2 w-fit"
      auto-focus
      @update:model-value="emit('filterChange', $event)"
    />
  </div>

  <!-- 常规状态 -->
  <div
    v-else
    :class="`flex w-full items-center justify-between ${isNormalSize ? '' : 'gap-1'}`"
    data-testid="tools-bar"
  >
    <Button
      v-if="isShowChatPage && isNonMobile"
      variant="ghost"
      :class="`rounded p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
      :title="t('chat.hideSidebar') as string"
      :aria-label="t('chat.hideSidebar') as string"
      @click="collapseSidebar"
    >
      <PanelLeftClose :size="isNormalSize ? 16 : 15" />
    </Button>
    <span v-else aria-hidden="true" />

    <div :class="`flex ${isNormalSize ? '' : 'gap-1'}`">
      <Button
        v-if="props.filterText !== undefined"
        variant="ghost"
        :class="`rounded-lg p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
        :title="t('common.search') as string"
        :aria-label="t('common.search') as string"
        data-testid="search-button"
        @click="isSearching = true"
      >
        <Search :size="isNormalSize ? 16 : 15" />
      </Button>
      <!-- 新增聊天按钮 -->
      <Button
        v-if="isNonMobile"
        variant="ghost"
        :class="`ml-1 rounded-lg p-0 ${isNormalSize ? 'h-8 w-8' : 'h-7 w-7'}`"
        data-testid="create-chat-button"
        :title="t('chat.createChat') as string"
        :aria-label="t('chat.createChat') as string"
        @click="createNewChat"
      >
        <Plus :size="isNormalSize ? 16 : 15" />
      </Button>
    </div>
  </div>
</template>

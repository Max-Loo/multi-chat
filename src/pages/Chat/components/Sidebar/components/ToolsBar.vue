<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { ArrowLeft, PanelLeftClose, Plus, Search } from 'lucide-vue-next';
import { FilterInput } from '@/components/FilterInput';
import { Button } from '@/components/ui/button';
import { useChatPageStore } from '@/store/chatPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useResponsive } from '@/composables/useResponsive';

/**
 * 工具栏属性
 */
interface ToolsBarProps {
  /** 过滤文本（受控；由父组件管理搜索状态） */
  filterText?: string;
}

const props = defineProps<ToolsBarProps>();

const emit = defineEmits<{
  /** 过滤文本变化 */
  (e: 'update:filterText', value: string): void;
}>();

const { t } = useTranslation();
const chatPageStore = useChatPageStore();

const { layoutMode } = useResponsive();
// Desktop 和 Mobile 模式使用正常尺寸
const isNormalSize = computed(
  () => layoutMode.value === 'desktop' || layoutMode.value === 'mobile',
);
// 非 Mobile 模式（Desktop、Compact、Compressed）显示隐藏侧边栏按钮
const isNonMobile = computed(() => layoutMode.value !== 'mobile');
const { createNewChat } = useCreateChat();

// 是否展示搜索状态
const isSearching = ref(false);

/** 隐藏聊天页侧边栏 */
function collapseSidebar(): void {
  chatPageStore.setIsCollapsed(true);
}

/**
 * 点击返回退出搜索
 */
function quitSearch(): void {
  isSearching.value = false;
  // 重置搜索的关键字
  emit('update:filterText', '');
}

/** 进入搜索状态 */
function startSearch(): void {
  isSearching.value = true;
}
</script>

<!-- 聊天侧边栏顶部工具栏 -->
<template>
  <!-- 搜索状态：返回按钮 + 过滤输入框 -->
  <div v-if="isSearching" class="flex items-center justify-between w-full" data-testid="tools-bar">
    <Button
      variant="ghost"
      :class="['rounded-lg p-1', isNormalSize ? 'h-8 w-8' : 'h-7 w-7']"
      :aria-label="t('common.search')"
      @click="quitSearch"
    >
      <ArrowLeft :size="isNormalSize ? 16 : 15" />
    </Button>
    <FilterInput
      :model-value="props.filterText || ''"
      class="w-fit ml-2"
      autofocus
      @update:model-value="(value: string) => emit('update:filterText', value)"
    />
  </div>

  <!-- 常规状态：折叠侧边栏 / 搜索 / 新建聊天 -->
  <div
    v-else
    :class="['flex items-center justify-between w-full', isNormalSize ? '' : 'gap-1']"
    data-testid="tools-bar"
  >
    <Button
      v-if="chatPageStore.isShowChatPage && isNonMobile"
      variant="ghost"
      :class="['rounded p-0', isNormalSize ? 'h-8 w-8' : 'h-7 w-7']"
      :title="t('chat.hideSidebar')"
      :aria-label="t('chat.hideSidebar')"
      @click="collapseSidebar"
    >
      <PanelLeftClose :size="isNormalSize ? 16 : 15" />
    </Button>
    <span v-else aria-hidden="true" />

    <div :class="['flex', isNormalSize ? '' : 'gap-1']">
      <!-- 搜索入口（受控模式才显示） -->
      <Button
        v-if="props.filterText !== undefined"
        variant="ghost"
        :class="['rounded-lg p-0', isNormalSize ? 'h-8 w-8' : 'h-7 w-7']"
        :title="t('common.search')"
        :aria-label="t('common.search')"
        data-testid="search-button"
        @click="startSearch"
      >
        <Search :size="isNormalSize ? 16 : 15" />
      </Button>

      <!-- 新增聊天按钮 -->
      <Button
        v-if="isNonMobile"
        variant="ghost"
        :class="['rounded-lg p-0 ml-1', isNormalSize ? 'h-8 w-8' : 'h-7 w-7']"
        data-testid="create-chat-button"
        :title="t('chat.createChat')"
        :aria-label="t('chat.createChat')"
        @click="createNewChat"
      >
        <Plus :size="isNormalSize ? 16 : 15" />
      </Button>
    </div>
  </div>
</template>

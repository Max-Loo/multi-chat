<script setup lang="ts">
/**
 * 聊天侧边栏工具栏（对应旧版 ToolsBar.tsx）
 * 侧边栏折叠、搜索、新建聊天
 */
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import FilterInput from '@/components/FilterInput/FilterInput.vue';
import { useChatPageStore } from '@/stores';
import { useCreateChat } from '@/composables/useCreateChat';
import { ArrowLeft, PanelLeftClose, Plus, Search } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { isString } from 'es-toolkit';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 过滤文本（传入即启用搜索按钮） */
    filterText?: string;
  }>(),
  { filterText: undefined },
);

/** 过滤文本变化事件 */
const emit = defineEmits<{
  'update:filterText': [value: string];
}>();

const { t } = useTranslation();
const chatPageStore = useChatPageStore();
const { isShowChatPage } = storeToRefs(chatPageStore);

const { layoutMode } = useResponsive();
// Desktop 和 Mobile 模式使用正常尺寸
const isNormalSize = computed(
  () => layoutMode.value === 'desktop' || layoutMode.value === 'mobile',
);
// 非 Mobile 模式显示隐藏侧边栏按钮
const isNonMobile = computed(() => layoutMode.value !== 'mobile');
const { createNewChat } = useCreateChat();

// 是否展示搜索状态
const isSearching = ref(false);

/** 点击返回退出搜索 */
const quitSearch = (): void => {
  isSearching.value = false;
  // 重置搜索的关键字
  emit('update:filterText', '');
};

/** 隐藏聊天页侧边栏 */
const collapseSidebar = (): void => {
  chatPageStore.setIsCollapsed(true);
};

/** 尺寸类（正常/紧凑） */
const sizeClass = computed(() =>
  isNormalSize.value ? 'h-8 w-8' : 'h-7 w-7',
);
const iconSize = computed(() => (isNormalSize.value ? 16 : 15));

void props;
</script>

<template>
  <!-- 搜索态 -->
  <div v-if="isSearching" class="flex w-full items-center justify-between" data-testid="tools-bar">
    <Button
      variant="ghost"
      :class="`rounded-lg p-1 ${sizeClass}`"
      :aria-label="t('common.search')"
      @click="quitSearch"
    >
      <ArrowLeft :size="iconSize" />
    </Button>
    <FilterInput
      :model-value="filterText || ''"
      class-name="ml-2 w-fit"
      auto-focus
      @update:model-value="(value: string) => emit('update:filterText', value)"
    />
  </div>

  <!-- 常态 -->
  <div
    v-else
    :class="`flex w-full items-center justify-between ${isNormalSize ? '' : 'gap-1'}`"
    data-testid="tools-bar"
  >
    <Button
      v-if="isShowChatPage && isNonMobile"
      variant="ghost"
      :class="`rounded p-0 ${sizeClass}`"
      :title="t('chat.hideSidebar')"
      :aria-label="t('chat.hideSidebar')"
      @click="collapseSidebar"
    >
      <PanelLeftClose :size="iconSize" />
    </Button>
    <span v-else aria-hidden="true" />
    <div :class="`flex ${isNormalSize ? '' : 'gap-1'}`">
      <Button
        v-if="isString(filterText) || filterText === ''"
        variant="ghost"
        :class="`rounded-lg p-0 ${sizeClass}`"
        :title="t('common.search')"
        :aria-label="t('common.search')"
        data-testid="search-button"
        @click="isSearching = true"
      >
        <Search :size="iconSize" />
      </Button>
      <!-- 新增聊天按钮 -->
      <Button
        v-if="isNonMobile"
        variant="ghost"
        :class="`ml-1 rounded-lg p-0 ${sizeClass}`"
        data-testid="create-chat-button"
        :title="t('chat.createChat')"
        :aria-label="t('chat.createChat')"
        @click="createNewChat"
      >
        <Plus :size="iconSize" />
      </Button>
    </div>
  </div>
</template>

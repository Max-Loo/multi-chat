<script setup lang="ts">
/**
 * 聊天面板头部组件（Vue 版 PanelHeader）
 * 聊天名称、侧边栏展开、列数控制、Splitter 开关
 */
import { computed, onMounted, onUnmounted } from 'vue';
import { PanelLeftOpen, Minus, Plus, Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { Input } from '@/components/ui-vue/input';
import { Switch } from '@/components/ui-vue/switch';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useSelectedChat } from '@/composables/pages/useSelectedChat';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{
  columnCount: number;
  isSplitter: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:columnCount', value: number): void;
  (e: 'update:isSplitter', value: boolean): void;
}>();

const { t } = useTranslation();
const { isMobile } = useResponsive();
const { createNewChat } = useCreateChat();
const chatPageStore = useChatPageStore();
const { selectedChat, chatModelList } = useSelectedChat();

const isSidebarCollapsed = computed(() => chatPageStore.isSidebarCollapsed);

// 展开侧边栏
const expandSidebar = () => {
  chatPageStore.setIsCollapsed(false);
};

// 打开抽屉
const openDrawer = () => {
  chatPageStore.toggleDrawer();
};

// 记录是否打开了具体聊天页面（挂载/卸载时标记）
onMounted(() => {
  chatPageStore.setIsShowChatPage(true);
});
onUnmounted(() => {
  chatPageStore.setIsShowChatPage(false);
});

const setColumnCount = (value: number) => emit('update:columnCount', value);
const setIsSplitter = (value: boolean) => emit('update:isSplitter', value);
</script>

<template>
  <div class="relative z-10 flex h-12 w-full items-center justify-between border-b border-gray-200 pl-3 pr-3" data-testid="chat-panel-header">
    <div class="flex items-center justify-start">
      <!-- 打开聊天列表抽屉的按钮 -->
      <Button
        v-if="isMobile"
        variant="ghost"
        class="mr-2 h-8 w-8 rounded p-0"
        :aria-label="t('navigation.openChatList') as string"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
      <Button
        v-if="isSidebarCollapsed && !isMobile"
        variant="ghost"
        class="mr-2 h-8 w-8 rounded p-0"
        :title="t('chat.showSidebar') as string"
        @click="expandSidebar"
      >
        <PanelLeftOpen size="16" />
      </Button>
      <span class="text-base">
        {{ selectedChat?.name || t('chat.unnamed') }}
      </span>
    </div>

    <div class="flex items-center">
      <div v-if="chatModelList.length > 1 && !isMobile" class="flex items-center justify-start text-sm">
        <span>{{ t('chat.enableSplitter') }}</span>
        <Switch
          :model-value="props.isSplitter"
          class="mr-2"
          data-testid="splitter-switch"
          @update:model-value="setIsSplitter"
        />
        <span>{{ t('chat.maxPerRow') }}</span>
        <Input
          type="number"
          class="h-8 w-16"
          data-testid="column-count-input"
          :model-value="props.columnCount"
          :max="chatModelList.length || 1"
          min="1"
          @update:model-value="setColumnCount(Number($event) || chatModelList.length)"
        />
        <span class="ml-1">{{ t('chat.itemsUnit') }}</span>
        <Button
          variant="ghost"
          class="ml-1 h-8 w-8 p-0"
          data-testid="column-plus-btn"
          :aria-label="t('chat.increaseColumns') as string"
          :disabled="props.columnCount >= chatModelList.length"
          @click="setColumnCount(props.columnCount + 1)"
        >
          <Plus size="16" />
        </Button>
        <Button
          variant="ghost"
          class="ml-1 h-8 w-8 p-0"
          data-testid="column-minus-btn"
          :aria-label="t('chat.decreaseColumns') as string"
          :disabled="props.columnCount <= 1"
          @click="setColumnCount(props.columnCount - 1)"
        >
          <Minus size="16" />
        </Button>
      </div>

      <Button
        v-if="isMobile"
        variant="ghost"
        class="h-7 w-7 rounded p-0"
        :title="t('chat.createChat') as string"
        :aria-label="t('navigation.createChat') as string"
        @click="createNewChat"
      >
        <Plus size="15" />
      </Button>
    </div>
  </div>
</template>

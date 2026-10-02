<script setup lang="ts">
/**
 * 聊天面板头部组件（对应旧版 Panel/Header.tsx）
 * 显示聊天名称与列数控制
 */
import { onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { PanelLeftOpen, Minus, Plus, Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useChatPageStore } from '@/stores';
import { useCreateChat } from '@/composables/useCreateChat';
import { useSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
const props = defineProps<{
  columnCount: number;
  isSplitter: boolean;
}>();

/** 列数与 Splitter 开关更新事件 */
const emit = defineEmits<{
  'update:columnCount': [value: number];
  'update:isSplitter': [value: boolean];
}>();

const { t } = useTranslation();
const { isMobile } = useResponsive();
const { createNewChat } = useCreateChat();

const chatPageStore = useChatPageStore();
const { isSidebarCollapsed } = storeToRefs(chatPageStore);
const { selectedChat, chatModelList } = useSelectedChat();

/** 展开侧边栏 */
const expandSidebar = (): void => {
  chatPageStore.setIsCollapsed(false);
};

/** 打开抽屉 */
const openDrawer = (): void => {
  chatPageStore.toggleDrawer();
};

/** 设置列数（带下限保护） */
const setColumnCount = (value: number): void => {
  emit('update:columnCount', value || chatModelList.value.length || 1);
};

/** 切换 Splitter */
const setIsSplitter = (value: boolean): void => {
  emit('update:isSplitter', value);
};

// 记录是否打开了具体聊天页面（离开页面时复位）
onMounted(() => {
  chatPageStore.setIsShowChatPage(true);
});
onUnmounted(() => {
  chatPageStore.setIsShowChatPage(false);
});

// chatModelList 变化时对列数做上限保护
watch(chatModelList, (list) => {
  if (props.columnCount > (list.length || 1)) {
    emit('update:columnCount', list.length || 1);
  }
});
</script>

<template>
  <div
    class="relative z-10 flex h-12 w-full items-center justify-between border-b border-gray-200 pl-3 pr-3"
    data-testid="chat-panel-header"
  >
    <div class="flex items-center justify-start">
      <!-- 打开聊天列表抽屉的按钮 -->
      <Button
        v-if="isMobile"
        variant="ghost"
        class="mr-2 h-8 w-8 rounded p-0"
        :aria-label="t('navigation.openChatList')"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
      <Button
        v-if="isSidebarCollapsed && !isMobile"
        variant="ghost"
        class="mr-2 h-8 w-8 rounded p-0"
        :title="t('chat.showSidebar')"
        @click="expandSidebar"
      >
        <PanelLeftOpen :size="16" />
      </Button>
      <span class="text-base">
        {{ selectedChat?.name || t('chat.unnamed') }}
      </span>
    </div>
    <div class="flex items-center">
      <div
        v-if="chatModelList.length > 1 && !isMobile"
        class="flex items-center justify-start text-sm"
      >
        <span>{{ t('chat.enableSplitter') }}</span>
        <Switch
          :model-value="isSplitter"
          class="mr-2"
          data-testid="splitter-switch"
          @update:model-value="setIsSplitter"
        />
        <span>{{ t('chat.maxPerRow') }}</span>
        <Input
          type="number"
          class="h-8 w-16"
          data-testid="column-count-input"
          :min="1"
          :max="chatModelList.length || 1"
          :model-value="columnCount"
          @update:model-value="(value: string | number) => setColumnCount(Number(value))"
        />
        <span class="ml-1">{{ t('chat.itemsUnit') }}</span>
        <Button
          variant="ghost"
          class="ml-1 h-8 w-8 p-0"
          data-testid="column-plus-btn"
          :aria-label="t('chat.increaseColumns')"
          :disabled="columnCount >= chatModelList.length"
          @click="setColumnCount(columnCount + 1)"
        >
          <Plus :size="16" />
        </Button>
        <Button
          variant="ghost"
          class="ml-1 h-8 w-8 p-0"
          data-testid="column-minus-btn"
          :aria-label="t('chat.decreaseColumns')"
          :disabled="columnCount <= 1"
          @click="setColumnCount(columnCount - 1)"
        >
          <Minus :size="16" />
        </Button>
      </div>

      <Button
        v-if="isMobile"
        variant="ghost"
        class="h-7 w-7 rounded p-0"
        :title="t('chat.createChat')"
        :aria-label="t('navigation.createChat')"
        @click="createNewChat"
      >
        <Plus :size="15" />
      </Button>
    </div>
  </div>
</template>

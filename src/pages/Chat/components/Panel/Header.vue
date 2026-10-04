<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useTranslation } from 'i18next-vue';
import { PanelLeftOpen, Minus, Plus, Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useChatPageStore } from '@/store/chatPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useChatPageSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useResponsive } from '@/composables/useResponsive';

/**
 * 聊天面板头部属性
 */
interface HeaderProps {
  /** 每行列数（v-model） */
  columnCount: number;
  /** 是否启用可拖拽分割布局（v-model） */
  isSplitter: boolean;
}

const props = defineProps<HeaderProps>();

const emit = defineEmits<{
  (e: 'update:columnCount', value: number): void;
  (e: 'update:isSplitter', value: boolean): void;
}>();

const { t } = useTranslation();
const chatPageStore = useChatPageStore();
const { createNewChat } = useCreateChat();
const { isMobile } = useResponsive();

const { selectedChat, chatModelList } = useChatPageSelectedChat();

/** 展开侧边栏 */
function expandSidebar(): void {
  chatPageStore.setIsCollapsed(false);
}

/** 打开抽屉 */
function openDrawer(): void {
  chatPageStore.toggleDrawer();
}

/**
 * 更新每行列数（数值输入，非法值回退到模型数量）
 * @param value 输入值
 */
function setColumnCount(value: number): void {
  emit('update:columnCount', value || chatModelList.value.length);
}

// 记录是否打开了具体聊天页面（供 ToolsBar 判断折叠按钮显示）
onMounted(() => {
  chatPageStore.setIsShowChatPage(true);
});

onBeforeUnmount(() => {
  chatPageStore.setIsShowChatPage(false);
});
</script>

<!-- 聊天面板头部组件 -->
<template>
  <div
    class="relative z-10 flex items-center justify-between w-full h-12 pl-3 pr-3 border-b border-gray-200"
    data-testid="chat-panel-header"
  >
    <div class="flex items-center justify-start">
      <!-- 打开聊天列表抽屉的按钮 -->
      <Button
        v-if="isMobile"
        variant="ghost"
        class="rounded mr-2 h-8 w-8 p-0"
        :aria-label="t('navigation.openChatList')"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>

      <!-- 展开侧边栏按钮 -->
      <Button
        v-if="chatPageStore.isSidebarCollapsed && !isMobile"
        variant="ghost"
        class="rounded mr-2 h-8 w-8 p-0"
        :title="t('chat.showSidebar')"
        :aria-label="t('chat.showSidebar')"
        @click="expandSidebar"
      >
        <PanelLeftOpen :size="16" />
      </Button>

      <span class="text-base">
        {{ selectedChat?.name || t('chat.unnamed') }}
      </span>
    </div>

    <div class="flex items-center">
      <!-- 多列布局控制 -->
      <div
        v-if="chatModelList.length > 1 && !isMobile"
        class="flex items-center justify-start text-sm"
      >
        <span>{{ t('chat.enableSplitter') }}</span>
        <Switch
          :model-value="props.isSplitter"
          class="mr-2"
          data-testid="splitter-switch"
          :aria-label="t('chat.enableSplitter')"
          @update:model-value="(value: boolean) => emit('update:isSplitter', value)"
        />
        <span>{{ t('chat.maxPerRow') }}</span>
        <Input
          type="number"
          class="w-16 h-8"
          data-testid="column-count-input"
          min="1"
          :max="chatModelList.length || 1"
          :model-value="props.columnCount"
          @update:model-value="(value: string | number) => setColumnCount(Number(value))"
        />
        <span class="ml-1">{{ t('chat.itemsUnit') }}</span>
        <Button
          variant="ghost"
          class="ml-1 h-8 w-8 p-0"
          data-testid="column-plus-btn"
          :aria-label="t('chat.increaseColumns')"
          :disabled="props.columnCount >= chatModelList.length"
          @click="emit('update:columnCount', props.columnCount + 1)"
        >
          <Plus :size="16" />
        </Button>
        <Button
          variant="ghost"
          class="ml-1 h-8 w-8 p-0"
          data-testid="column-minus-btn"
          :aria-label="t('chat.decreaseColumns')"
          :disabled="props.columnCount <= 1"
          @click="emit('update:columnCount', props.columnCount - 1)"
        >
          <Minus :size="16" />
        </Button>
      </div>

      <!-- Mobile：新建聊天 -->
      <Button
        v-if="isMobile"
        variant="ghost"
        class="rounded h-7 w-7 p-0"
        :title="t('chat.createChat')"
        :aria-label="t('navigation.createChat')"
        @click="createNewChat"
      >
        <Plus :size="15" />
      </Button>
    </div>
  </div>
</template>

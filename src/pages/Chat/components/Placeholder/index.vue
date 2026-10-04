<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { Menu, Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useChatPageStore } from '@/store/chatPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useResponsive } from '@/composables/useResponsive';

/**
 * 聊天页面未选择聊天时的占位内容
 */
const { t } = useTranslation();
const chatPageStore = useChatPageStore();
const { createNewChat } = useCreateChat();
const { isMobile } = useResponsive();

/** 打开抽屉 */
function openDrawer(): void {
  chatPageStore.toggleDrawer();
}
</script>

<template>
  <div class="relative flex items-center justify-center w-full h-full">
    <!-- Mobile 模式：抽屉入口与新建入口 -->
    <template v-if="isMobile">
      <Button
        variant="ghost"
        class="absolute top-4 left-4 rounded h-8 w-8 p-0"
        :aria-label="t('navigation.openChatList')"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        class="absolute top-4 right-4 rounded h-8 w-8 p-0"
        :title="t('chat.createChat')"
        :aria-label="t('navigation.createChat')"
        @click="createNewChat"
      >
        <Plus :size="16" />
      </Button>
    </template>

    <div class="text-4xl">{{ t('chat.selectChatToStart') }}</div>
  </div>
</template>

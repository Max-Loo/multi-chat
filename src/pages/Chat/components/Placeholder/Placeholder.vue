<script setup lang="ts">
/**
 * 聊天页面未选择聊天时的占位内容（对应旧版 Placeholder/index.tsx）
 */
import { Menu, Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useChatPageStore } from '@/stores';
import { useCreateChat } from '@/composables/useCreateChat';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();
const chatPageStore = useChatPageStore();
const { createNewChat } = useCreateChat();
const { isMobile } = useResponsive();

/** 打开抽屉 */
const openDrawer = (): void => {
  chatPageStore.toggleDrawer();
};
</script>

<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <template v-if="isMobile">
      <Button
        variant="ghost"
        class="absolute left-4 top-4 h-8 w-8 rounded p-0"
        :aria-label="t('navigation.openChatList')"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        class="absolute right-4 top-4 h-8 w-8 rounded p-0"
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

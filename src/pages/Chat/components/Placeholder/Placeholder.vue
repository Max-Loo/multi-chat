<script setup lang="ts">
/**
 * 聊天页面未选择聊天时的占位内容（Vue 版 Placeholder）
 */
import { Menu, Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { useCreateChat } from '@/composables/useCreateChat';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();
const chatPageStore = useChatPageStore();
const { createNewChat } = useCreateChat();
const { isMobile } = useResponsive();

// 打开抽屉
const openDrawer = () => {
  chatPageStore.toggleDrawer();
};
</script>

<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <!-- 移动端：抽屉与新建入口 -->
    <template v-if="isMobile">
      <Button
        variant="ghost"
        class="absolute left-4 top-4 h-8 w-8 rounded p-0"
        :aria-label="t('navigation.openChatList') as string"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        class="absolute right-4 top-4 h-8 w-8 rounded p-0"
        :title="t('chat.createChat') as string"
        :aria-label="t('navigation.createChat') as string"
        @click="createNewChat"
      >
        <Plus size="16" />
      </Button>
    </template>

    <div class="text-4xl">{{ t('chat.selectChatToStart') }}</div>
  </div>
</template>

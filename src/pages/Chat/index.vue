<script setup lang="ts">
/**
 * 聊天页面（对应旧版 pages/Chat/index.tsx）
 *
 * 桌面端：可折叠侧边栏 + 内容区；移动端：抽屉侧边栏 + 内容区。
 * 处理 URL chatId 参数的校验与重定向。
 */
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '@/pages/Chat/components/Sidebar/ChatSidebar.vue';
import Content from '@/pages/Chat/components/Content/Content.vue';
import { MobileDrawer } from '@/components/MobileDrawer';
import { storeToRefs } from 'pinia';
import { useChatStore, useChatPageStore } from '@/stores';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { computed } from 'vue';
import { cn } from '@/utils/utils';

const { t } = useTranslation();
const route = useRoute();
const chatStore = useChatStore();
const chatPageStore = useChatPageStore();
const { isSidebarCollapsed, isDrawerOpen } = storeToRefs(chatPageStore);
const { chatMetaList, loading, initializationError } = storeToRefs(chatStore);
const { isDesktop, isMobile } = useResponsive();

const { clearChatIdParam } = useNavigateToChat();

/**
 * 聊天重定向逻辑
 *
 * 当用户通过 URL 参数访问聊天时（例如 /chat?chatId=xxx），需要检查该聊天是否存在。
 * 如果聊天已被删除或不存在，则自动重定向到 /chat 页面，避免显示错误状态。
 */
watch(
  [() => route.query.chatId, loading, initializationError],
  ([chatId]) => {
    // 如果聊天列表正在加载，则等待加载完成后再检查（避免误判）
    if (loading.value) {
      return;
    }

    // 如果聊天列表加载失败，则不执行重定向检查
    if (initializationError.value) {
      return;
    }

    // 如果 URL 中没有 chatId 参数，则不执行检查
    if (!chatId || typeof chatId !== 'string') {
      return;
    }

    // 检查聊天是否存在于元数据列表中
    const chatMeta = chatMetaList.value.find((m) => m.id === chatId);

    if (chatMeta) {
      // 聊天存在，正常设置选中的聊天 ID 并预加载供应商 SDK
      void chatStore.setSelectedChatIdWithPreload(chatId);
    } else {
      // 聊天不存在，清除 URL 中的 chatId 参数
      clearChatIdParam();
    }
  },
  { immediate: true },
);

/** 侧边栏容器类（折叠动画） */
const sidebarWrapperClass = computed(() =>
  cn(
    'h-full shrink-0 overflow-hidden border-r border-gray-200',
    'transition-spacing duration-300 ease-in-out',
    'will-change-transform will-change-opacity',
    isSidebarCollapsed.value
      ? (isDesktop.value ? '-ml-56' : '-ml-48') + ' -translate-x-full opacity-0'
      : 'ml-0 translate-x-0 opacity-100',
    isDesktop.value ? 'w-56' : 'w-48',
  ),
);

/** 处理抽屉打开/关闭状态变化 */
const handleDrawerOpenChange = (open: boolean): void => {
  chatPageStore.setIsDrawerOpen(open);
};
</script>

<template>
  <div
    class="flex h-full w-full items-start justify-start overflow-hidden"
    data-testid="chat-page"
  >
    <!-- Mobile 模式：抽屉 -->
    <MobileDrawer
      v-if="isMobile"
      :open="isDrawerOpen"
      :show-close-button="false"
      @update:open="handleDrawerOpenChange"
    >
      <Sidebar />
    </MobileDrawer>

    <!-- 非 Mobile 模式：直接显示侧边栏 -->
    <aside
      v-if="!isMobile"
      data-testid="chat-sidebar-wrapper"
      :class="sidebarWrapperClass"
      :aria-label="t('common.a11y.chatList')"
    >
      <Sidebar />
    </aside>

    <!-- 主内容 -->
    <main data-testid="chat-content" class="h-full grow overflow-x-auto">
      <Content />
    </main>
  </div>
</template>

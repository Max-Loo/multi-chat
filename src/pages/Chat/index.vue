<script setup lang="ts">
/**
 * 聊天页面主编排（Vue 版 ChatPage）
 * 移动端抽屉 / 侧边栏折叠 / URL chatId 重定向，行为与 React 版保持一致
 */
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '@/pages/Chat/components/Sidebar/index.vue';
import Content from '@/pages/Chat/components/Content/Content.vue';
import MobileDrawer from '@/components/MobileDrawer.vue';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { useChatStore } from '@/store/pinia/chat';
import { useResponsive } from '@/composables/useResponsive';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();
const route = useRoute();
const chatPageStore = useChatPageStore();
const chatStore = useChatStore();
const { isDesktop, isMobile } = useResponsive();
const { clearChatIdParam } = useNavigateToChat();

const isSidebarCollapsed = computed(() => chatPageStore.isSidebarCollapsed);
const isDrawerOpen = computed(() => chatPageStore.isDrawerOpen);

// 获取聊天元数据列表和加载状态
const chatMetaList = computed(() => chatStore.chatMetaList);
const loading = computed(() => chatStore.loading);
const initializationError = computed(() => chatStore.initializationError);

/**
 * @description 聊天重定向逻辑
 *
 * 当用户通过 URL 参数访问聊天时（例如 /chat?chatId=xxx），需要检查该聊天是否存在。
 * 如果聊天已被删除或不存在，则自动重定向到 /chat 页面，避免显示错误状态。
 */
watch(
  () => [route.query.chatId, loading.value, initializationError.value] as const,
  ([chatId, isLoading, initError]) => {
    // 如果聊天列表正在加载，则等待加载完成后再检查（避免误判）
    if (isLoading) return;
    // 如果聊天列表加载失败，则不执行重定向检查
    if (initError) return;
    // 如果 URL 中没有 chatId 参数，则不执行检查
    if (!chatId) return;

    // 检查聊天是否存在于元数据列表中
    const chatMeta = chatMetaList.value.find((m) => m.id === chatId);

    if (chatMeta) {
      // 聊天存在：设置选中的聊天 ID 并预加载供应商 SDK
      void chatStore.setSelectedChatIdWithPreload(chatId as string);
    } else {
      // 聊天不存在，清除 URL 中的 chatId 参数
      clearChatIdParam();
    }
  },
  { immediate: true },
);

/** 处理抽屉打开/关闭状态变化 */
const handleDrawerOpenChange = (open: boolean) => {
  chatPageStore.setIsDrawerOpen(open);
};
</script>

<template>
  <div class="flex h-full w-full items-start justify-start overflow-hidden" data-testid="chat-page">
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
      :aria-label="t('common.a11y.chatList') as string"
      :class="`
        h-full overflow-hidden border-r border-gray-200 shrink-0
        transition-spacing duration-300 ease-in-out
        will-change-transform will-change-opacity
        ${isSidebarCollapsed ? (isDesktop ? '-ml-56' : '-ml-48') + ' -translate-x-full opacity-0' : 'ml-0 translate-x-0 opacity-100'}
        ${isDesktop ? 'w-56' : 'w-48'}
      `"
    >
      <Sidebar />
    </aside>

    <!-- 主内容 -->
    <main data-testid="chat-content" class="h-full grow overflow-x-auto">
      <Content />
    </main>
  </div>
</template>

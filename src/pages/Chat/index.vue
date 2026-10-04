<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import Sidebar from '@/pages/Chat/components/Sidebar/index.vue';
import Content from '@/pages/Chat/components/Content/index.vue';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useChatStore } from '@/store/chat';
import { useChatPageStore } from '@/store/chatPage';
import { useResponsive } from '@/composables/useResponsive';
import { useNavigateToChat } from '@/composables/useNavigateToPage';

/**
 * 聊天页面组件
 */
const { t } = useTranslation();
const route = useRoute();
const chatStore = useChatStore();
const chatPageStore = useChatPageStore();
const { isDesktop, isMobile } = useResponsive();
const { clearChatIdParam } = useNavigateToChat();

/**
 * 聊天重定向逻辑
 *
 * 当用户通过 URL 参数访问聊天时（例如 /chat?chatId=xxx），需要检查该聊天是否存在。
 * 如果聊天已被删除或不存在，则自动清除 URL 参数，避免显示错误状态。
 *
 * 实现要点：
 * 1. 等待聊天列表加载完成后再执行检查（避免误判）
 * 2. 检查聊天是否存在（chatMetaList 均为未删除项）
 * 3. 使用 replace 替换浏览器历史记录，避免用户「后退」回到无效 URL
 */
watch(
  () => [route.query.chatId, chatStore.loading] as const,
  ([chatId]) => {
    // 如果聊天列表正在加载，则等待加载完成后再检查
    if (chatStore.loading) {
      return;
    }

    // 如果聊天列表加载失败，则不执行重定向检查
    if (chatStore.initializationError) {
      return;
    }

    // 如果 URL 中没有 chatId 参数，则不执行检查
    if (!chatId || typeof chatId !== 'string') {
      return;
    }

    // 检查聊天是否存在于元数据列表中
    const chatMeta = chatStore.chatMetaList.find((m) => m.id === chatId);

    if (chatMeta) {
      // 聊天存在：正常设置选中的聊天 ID 并预加载供应商 SDK
      void chatStore.setSelectedChatIdWithPreload(chatId);
    } else {
      // 聊天不存在：清除 URL 中的 chatId 参数
      clearChatIdParam();
    }
  },
  { immediate: true },
);

/** 处理抽屉打开/关闭状态变化 */
function handleDrawerOpenChange(open: boolean): void {
  chatPageStore.setIsDrawerOpen(open);
}
</script>

<template>
  <div
    class="flex items-start justify-start w-full h-full overflow-hidden"
    data-testid="chat-page"
  >
    <!-- Mobile 模式：抽屉 -->
    <MobileDrawer
      v-if="isMobile"
      :open="chatPageStore.isDrawerOpen"
      show-close-button
      @update:open="handleDrawerOpenChange"
    >
      <Sidebar />
    </MobileDrawer>

    <!-- 非 Mobile 模式：直接显示侧边栏 -->
    <aside
      v-if="!isMobile"
      data-testid="chat-sidebar-wrapper"
      :class="[
        'h-full overflow-hidden border-r border-gray-200 shrink-0 transition-spacing duration-300 ease-in-out will-change-transform will-change-opacity',
        chatPageStore.isSidebarCollapsed
          ? (isDesktop ? '-ml-56' : '-ml-48') + ' -translate-x-full opacity-0'
          : 'ml-0 translate-x-0 opacity-100',
        isDesktop ? 'w-56' : 'w-48',
      ]"
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

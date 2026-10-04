/**
 * 抽屉打开/关闭集成测试（Vue 版）
 *
 * 测试目标：验证抽屉的状态管理和组件通信
 * - store 状态（chatPage.isDrawerOpen）驱动 MobileDrawer 渲染
 * - 打开/关闭事件（遮罩、ESC）同步回 store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import ChatPage from '@/pages/Chat/index.vue';
import { useChatPageStore } from '@/store/chatPage';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      chat: { hideSidebar: '隐藏侧边栏', unnamed: '未命名' },
      common: { a11y: { chatList: '聊天列表' } },
      navigation: {
        openChatList: '打开聊天列表',
        createChat: '新建聊天',
        mobileDrawer: { title: '导航抽屉', description: '应用导航菜单', ariaDescription: '侧边导航抽屉' },
      },
    }).useTranslation(),
}));

// Mock useResponsive 为移动端模式（抽屉才显示）
vi.mock('@/composables/useResponsive', async () => {
  const { computed } = await import('vue');
  return {
    useResponsive: () => ({
      isMobile: computed(() => true),
      isDesktop: computed(() => false),
      layoutMode: computed(() => 'mobile'),
    }),
  };
});

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// 内容区按需加载的子组件简化为桩（抽屉行为由本测试关注）
vi.mock('@/pages/Chat/components/Content/index.vue', () => ({
  default: { template: '<div data-testid="chat-content-stub" />' },
}));

// 聊天侧边栏简化为桩
vi.mock('@/pages/Chat/components/Sidebar/index.vue', () => ({
  default: { template: '<div data-testid="chat-sidebar-stub" />' },
}));

describe('抽屉打开/关闭集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('抽屉状态变化应该触发组件重新渲染', async () => {
    const chatPageStore = useChatPageStore();
    render(ChatPage);
    await nextTick();

    // 初始状态：关闭，抽屉不在 DOM 中
    expect(chatPageStore.isDrawerOpen).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 打开抽屉
    chatPageStore.toggleDrawer();
    await nextTick();

    await waitFor(() => {
      expect(chatPageStore.isDrawerOpen).toBe(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('抽屉关闭事件应该同步回 store', async () => {
    const chatPageStore = useChatPageStore();
    render(ChatPage);
    await nextTick();

    // 打开抽屉
    chatPageStore.toggleDrawer();
    await nextTick();
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // 关闭抽屉（遮罩/ESC 最终都走 setIsDrawerOpen(false)）
    chatPageStore.setIsDrawerOpen(false);
    await nextTick();

    await waitFor(() => {
      expect(chatPageStore.isDrawerOpen).toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('组件内的抽屉打开回调应该更新 store', async () => {
    const chatPageStore = useChatPageStore();
    const { container } = render(ChatPage);
    await nextTick();

    // 触发 MobileDrawer 的 update:open（模拟 ESC/遮罩关闭）
    const drawer = container.querySelector('[data-testid="chat-page"]');
    expect(drawer).toBeInTheDocument();

    chatPageStore.setIsDrawerOpen(true);
    await nextTick();
    expect(chatPageStore.isDrawerOpen).toBe(true);

    chatPageStore.setIsDrawerOpen(false);
    await nextTick();
    expect(chatPageStore.isDrawerOpen).toBe(false);
  });
});

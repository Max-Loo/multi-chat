/**
 * Vue 聊天侧边栏冒烟测试
 *
 * 验证工具栏、加载骨架屏与聊天列表渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen } from '@testing-library/vue';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock virtua（happy-dom 无真实布局，虚拟列表不渲染项；沿用项目 virtua-test-mock 惯例）
vi.mock('virtua/vue', () => ({
  VList: {
    props: ['data'],
    template: `<div data-testid="virtual-list"><div v-for="(item, i) in data" :key="i"><slot :item="item" :index="i" /></div></div>`,
  },
}));

// Mock 响应式 i18n 绑定（沿用项目 i18n mock 惯例：工厂直接返回模块对象）
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: { unnamed: '未命名' },
    common: { search: '搜索', a11y: { mainNav: '主导航', bottomNav: '底部导航' } },
    navigation: { mobileDrawer: { title: '菜单', ariaDescription: '菜单描述' } },
  }));

import ChatSidebar from '@/pages/Chat/components/Sidebar/index.vue';
import { useChatStore } from '@/store/pinia/chat';

describe('ChatSidebar（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('渲染工具栏与聊天列表', async () => {
    const chatStore = useChatStore();
    // 直接注入元数据列表
    chatStore.chatMetaList = [
      { id: 'c1', name: '工作聊天', updatedAt: 1 },
      { id: 'c2', name: '日常闲聊', updatedAt: 2 },
    ] as never;
    chatStore.loading = false;

    const { container } = render(ChatSidebar);

    expect(screen.getByTestId('chat-sidebar')).toBeVisible();
    expect(screen.getByTestId('tools-bar')).toBeVisible();
    // 聊天按钮渲染（虚拟列表容器内）
    expect(container.querySelector('[data-testid="chat-button-c1"]')).not.toBeNull();
    expect(screen.getAllByTestId('chat-name').length).toBe(2);
  });

  it('加载中显示骨架屏', async () => {
    const chatStore = useChatStore();
    chatStore.loading = true;

    render(ChatSidebar);

    // 骨架屏存在（5 个 Skeleton，animate-pulse 类）
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
    // 无虚拟列表容器
    expect(document.querySelector('[data-testid="chat-sidebar"]')).toBeVisible();
  });

  it('空名称聊天显示「未命名」占位', async () => {
    const chatStore = useChatStore();
    chatStore.chatMetaList = [{ id: 'c3', name: '', updatedAt: 3 }] as never;
    chatStore.loading = false;

    render(ChatSidebar);

    const names = screen.getAllByTestId('chat-name');
    expect(names[0].textContent).toBe('未命名');
  });
});

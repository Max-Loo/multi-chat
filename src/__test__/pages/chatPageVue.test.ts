/**
 * Vue Chat 页主编排冒烟测试
 *
 * 验证桌面端结构（侧边栏 + 内容区）与占位内容渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen } from '@testing-library/vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock virtua（沿用项目惯例）
vi.mock('virtua/vue', () => ({
  VList: {
    props: ['data'],
    template: `<div><div v-for="(item, i) in data" :key="i"><slot :item="item" :index="i" /></div></div>`,
  },
}));

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: { unnamed: '未命名', selectChatToStart: '选择聊天开始' },
    common: { search: '搜索' },
    navigation: { openChatList: '打开聊天列表', createChat: '新建聊天' },
  }));

import ChatPage from '@/pages/Chat/index.vue';

describe('ChatPage（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('桌面端渲染侧边栏包装与内容区', () => {
    render(ChatPage);

    expect(screen.getByTestId('chat-page')).toBeVisible();
    expect(screen.getByTestId('chat-sidebar-wrapper')).toBeVisible();
    expect(screen.getByTestId('chat-content')).toBeVisible();
  });

  it('未选择聊天时渲染占位内容', () => {
    render(ChatPage);

    // 新测试环境无选中聊天 → Placeholder
    expect(screen.getByText('选择聊天开始')).toBeVisible();
  });
});

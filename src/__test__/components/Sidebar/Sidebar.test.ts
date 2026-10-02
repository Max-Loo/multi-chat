/**
 * 应用侧边导航栏测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/components/Sidebar/Sidebar.test.tsx，保留核心行为语义：
 * - 渲染 3 个导航项（聊天/模型/设置）
 * - 按当前路径显示激活状态（含子路径）
 * - 点击导航：非激活跳转、激活不重复跳转
 * - 聊天导航记忆「上一次查看的聊天」
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  /** 当前路由路径（可变） */
  path: '/chat',
  routerPush: vi.fn(),
  navigateToChat: vi.fn(),
  clearChatIdParam: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: mocks.path }),
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mocks.navigateToChat,
    clearChatIdParam: mocks.clearChatIdParam,
  }),
}));

import Sidebar from '@/components/Sidebar/Sidebar.vue';
import { createAppPinia, useChatStore } from '@/stores';
import { createMockChat } from '@/__test__/helpers/testing-utils';

interface RenderOptions {
  selectedChatId?: string | null;
}

/** 渲染 Sidebar（可选注入选中聊天） */
function renderSidebar(options: RenderOptions = {}) {
  const pinia = createAppPinia();
  const chatStore = useChatStore(pinia);
  if (options.selectedChatId) {
    const chat = createMockChat({ id: options.selectedChatId });
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.activeChatData = { [chat.id]: chat };
    chatStore.selectedChatId = options.selectedChatId;
  }

  const result = render(Sidebar, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

/** 获取导航按钮（按标题文本） */
function getNavItem(name: string) {
  return screen.getByTitle(name);
}

describe('Sidebar 组件（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.path = '/chat';
  });

  it('应该渲染 3 个导航项', () => {
    renderSidebar();

    expect(getNavItem('聊天')).toBeInTheDocument();
    expect(getNavItem('模型')).toBeInTheDocument();
    expect(getNavItem('设置')).toBeInTheDocument();
  });

  it('在 /chat 路由时，聊天导航项应显示激活状态', () => {
    renderSidebar();

    expect(getNavItem('聊天')).toHaveAttribute('aria-current', 'page');
    expect(getNavItem('模型')).not.toHaveAttribute('aria-current');
  });

  it('在 /model 路由时，模型导航项应显示激活状态', () => {
    mocks.path = '/model';
    renderSidebar();

    expect(getNavItem('模型')).toHaveAttribute('aria-current', 'page');
    expect(getNavItem('聊天')).not.toHaveAttribute('aria-current');
  });

  it('在 /setting 路由时，设置导航项应显示激活状态', () => {
    mocks.path = '/setting';
    renderSidebar();

    expect(getNavItem('设置')).toHaveAttribute('aria-current', 'page');
  });

  it('在子路径时聊天导航项应显示激活状态', () => {
    mocks.path = '/chat/123';
    renderSidebar();

    // Vue 版使用 startsWith 判定前缀激活
    expect(getNavItem('聊天')).toHaveAttribute('aria-current', 'page');
  });

  it('点击非激活导航项应触发导航', async () => {
    mocks.path = '/model';
    renderSidebar();

    await fireEvent.click(getNavItem('设置'));

    expect(mocks.routerPush).toHaveBeenCalledWith('/setting');
  });

  it('点击已激活导航项不应触发重复导航', async () => {
    mocks.path = '/chat';
    renderSidebar();

    await fireEvent.click(getNavItem('聊天'));

    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(mocks.navigateToChat).not.toHaveBeenCalled();
  });

  it('从其他页面点击聊天导航且存在选中聊天时，应调用 navigateToChat', async () => {
    mocks.path = '/model';
    renderSidebar({ selectedChatId: 'chat-memory-1' });

    await fireEvent.click(getNavItem('聊天'));

    expect(mocks.navigateToChat).toHaveBeenCalledWith({
      chatId: 'chat-memory-1',
    });
  });

  it('从其他页面点击聊天导航且不存在选中聊天时，应直接导航到 /chat', async () => {
    mocks.path = '/model';
    renderSidebar();

    await fireEvent.click(getNavItem('聊天'));

    expect(mocks.navigateToChat).not.toHaveBeenCalled();
    expect(mocks.routerPush).toHaveBeenCalledWith('/chat');
  });

  it('应该接受并应用自定义 className', () => {
    const pinia = createAppPinia();
    const { container } = render(Sidebar, {
      props: { class: 'custom-sidebar-class' },
      global: { plugins: [pinia] },
    });

    expect(container.querySelector('nav')?.className).toContain(
      'custom-sidebar-class',
    );
  });
});

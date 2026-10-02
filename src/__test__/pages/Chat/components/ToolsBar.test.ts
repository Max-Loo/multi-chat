/**
 * ToolsBar 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/ChatSidebar/components/ToolsBar.test.tsx，
 * 保留核心行为语义：
 * - 常态工具栏渲染（隐藏侧边栏按钮、新建聊天按钮、搜索按钮）
 * - 创建新聊天
 * - 搜索模式切换与退出（重置过滤文本）
 * - 侧边栏折叠
 * - 响应式布局差异
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
  navigateToChat: vi.fn(),
  clearChatIdParam: vi.fn(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
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

import ToolsBar from '@/pages/Chat/components/Sidebar/components/ToolsBar.vue';
import { createAppPinia } from '@/stores';
import { useChatPageStore, useChatStore } from '@/stores';

interface RenderOptions {
  filterText?: string;
  isShowChatPage?: boolean;
}

/** 渲染 ToolsBar */
function renderToolsBar(options: RenderOptions = {}) {
  const pinia = createAppPinia();
  if (options.isShowChatPage !== undefined) {
    useChatPageStore(pinia).setIsShowChatPage(options.isShowChatPage);
  }
  const result = render(ToolsBar, {
    props: { filterText: options.filterText ?? '' },
    global: { plugins: [pinia] },
  });
  return { ...result, pinia };
}

describe('ToolsBar 组件（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  describe('默认工具栏渲染', () => {
    it('应该渲染工具栏容器', () => {
      renderToolsBar();

      expect(screen.getAllByTestId('tools-bar')).toHaveLength(1);
    });

    it('应该在聊天页面显示隐藏侧边栏按钮', () => {
      renderToolsBar({ isShowChatPage: true });

      expect(screen.getByTitle('隐藏侧边栏')).toBeInTheDocument();
    });

    it('应该显示新建聊天按钮', () => {
      renderToolsBar();

      expect(screen.getByTestId('create-chat-button')).toBeInTheDocument();
    });

    it('应该显示搜索按钮', () => {
      renderToolsBar();

      expect(screen.getByTestId('search-button')).toBeInTheDocument();
    });

    it('不在聊天页面时不应该显示隐藏侧边栏按钮', () => {
      renderToolsBar({ isShowChatPage: false });

      expect(screen.queryByTitle('隐藏侧边栏')).not.toBeInTheDocument();
    });
  });

  describe('创建新聊天功能', () => {
    it('点击新建聊天按钮应该创建新聊天并导航', async () => {
      const { pinia } = renderToolsBar();
      const chatStore = useChatStore(pinia);
      const createSpy = vi.spyOn(chatStore, 'createChat');

      await fireEvent.click(screen.getByTestId('create-chat-button'));

      expect(createSpy).toHaveBeenCalled();
      expect(mocks.navigateToChat).toHaveBeenCalled();
    });
  });

  describe('搜索功能', () => {
    it('点击搜索按钮应该进入搜索模式', async () => {
      renderToolsBar();

      await fireEvent.click(screen.getByTestId('search-button'));

      expect(screen.getByTestId('filter-input')).toBeInTheDocument();
    });

    it('搜索模式应该显示返回按钮和输入框', async () => {
      renderToolsBar();

      await fireEvent.click(screen.getByTestId('search-button'));

      // 返回按钮（ArrowLeft）的 aria-label 为「搜索」
      expect(screen.getByLabelText('搜索')).toBeInTheDocument();
      expect(screen.getByTestId('filter-input')).toBeInTheDocument();
    });

    it('输入框值变化应该向外 emit 过滤文本', async () => {
      const { emitted } = renderToolsBar();

      await fireEvent.click(screen.getByTestId('search-button'));
      await fireEvent.update(screen.getByTestId('filter-input'), '关键字');

      expect(emitted('update:filterText')).toEqual([['关键字']]);
    });

    it('点击返回按钮应该退出搜索模式并重置过滤文本', async () => {
      const { emitted } = renderToolsBar();

      await fireEvent.click(screen.getByTestId('search-button'));
      await fireEvent.update(screen.getByTestId('filter-input'), '关键字');
      await fireEvent.click(screen.getByLabelText('搜索'));

      expect(screen.queryByTestId('filter-input')).not.toBeInTheDocument();
      // 退出时重置为空字符串
      const events = emitted('update:filterText') as string[][];
      expect(events[events.length - 1]).toEqual(['']);
    });
  });

  describe('侧边栏折叠功能', () => {
    it('点击隐藏侧边栏按钮应该设置折叠状态', async () => {
      const { pinia } = renderToolsBar({ isShowChatPage: true });
      const chatPageStore = useChatPageStore(pinia);

      await fireEvent.click(screen.getByTitle('隐藏侧边栏'));

      expect(chatPageStore.isSidebarCollapsed).toBe(true);
    });
  });

  describe('响应式布局', () => {
    it('移动模式下不显示隐藏侧边栏与新建聊天按钮', () => {
      mocks.responsive.__set({ isMobile: true });

      renderToolsBar({ isShowChatPage: true });

      expect(screen.queryByTitle('隐藏侧边栏')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('create-chat-button'),
      ).not.toBeInTheDocument();
    });
  });
});

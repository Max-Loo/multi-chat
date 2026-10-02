/**
 * ChatSidebar 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/ChatSidebar.test.tsx，保留核心语义：
 * - 聊天列表渲染（未删除聊天、空列表、加载骨架）
 * - 新建聊天功能
 * - 搜索过滤（防抖）与退出搜索
 * - 选择聊天
 * - 响应式布局模式下正确渲染
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  /** 可变的响应式 mock（Ref 形状，与真实 useResponsive 一致） */
  responsive: globalThis.__createResponsiveMock(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

// Mock 自适应滚动条（依赖真实容器度量）
vi.mock('@/composables/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => globalThis.__createScrollbarMock(),
}));

// Mock virtua（Vue 版）虚拟滚动：渲染为可见范围内的普通列表
const virtuaState = vi.hoisted(() => ({ factory: null as null | Record<string, unknown> }));
vi.mock('virtua/vue', async () => {
  const { createVirtuaVueMock } = await import(
    '@/__test__/helpers/mocks/virtuaVue'
  );
  const factory = createVirtuaVueMock({ viewportHeight: 600, itemHeight: 44 });
  virtuaState.factory = factory as unknown as Record<string, unknown>;
  return { VList: factory.MockVList, Virtualizer: factory.MockVirtualizer };
});

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

// Mock 导航（useCreateChat 内部依赖 router）
const mockNavigateToChat = vi.fn();
vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
    clearChatIdParam: vi.fn(),
  }),
}));

// Mock 确认对话框（ChatButton 删除流程依赖）
vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ modal: { warning: vi.fn() } }),
}));

import ChatSidebar from '@/pages/Chat/components/Sidebar/ChatSidebar.vue';
import { createAppPinia } from '@/stores';
import { useChatStore } from '@/stores';
import type { ChatMeta } from '@/types/chat';
import { resetTestState } from '@/__test__/helpers/isolation';

/** 创建测试聊天元数据 */
const createSidebarMeta = (id: string, name: string): ChatMeta => ({
  id,
  name,
  modelIds: [],
  isDeleted: false,
});

/** 填充三个聊天元数据 */
function seedChats(pinia: ReturnType<typeof createAppPinia>) {
  useChatStore(pinia).chatMetaList = [
    createSidebarMeta('chat-1', '聊天 1'),
    createSidebarMeta('chat-2', '聊天 2'),
    createSidebarMeta('chat-3', '聊天 3'),
  ];
}

/** 渲染 ChatSidebar */
function renderChatSidebar() {
  const pinia = createAppPinia();
  seedChats(pinia);
  const result = render(ChatSidebar, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

describe('ChatSidebar 组件（Vue 版）', () => {
  beforeEach(async () => {
    await resetTestState();
    mocks.responsive.__reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('聊天列表渲染', () => {
    it('应该渲染所有未删除的聊天', () => {
      renderChatSidebar();

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-3')).toBeInTheDocument();
    });

    it('应该显示空列表状态', () => {
      const pinia = createAppPinia();
      render(ChatSidebar, { global: { plugins: [pinia] } });

      expect(
        screen.queryByTestId('chat-button-chat-1'),
      ).not.toBeInTheDocument();
    });

    it('应该在加载期间显示骨架屏', () => {
      const pinia = createAppPinia();
      useChatStore(pinia).loading = true;
      render(ChatSidebar, { global: { plugins: [pinia] } });

      // 全局 Skeleton mock 渲染为 data-testid="skeleton-item"
      expect(screen.getAllByTestId('skeleton-item').length).toBeGreaterThan(0);
      expect(
        screen.queryByTestId('chat-button-chat-1'),
      ).not.toBeInTheDocument();
    });
  });

  describe('新建聊天功能', () => {
    it('应该渲染新建聊天按钮', () => {
      renderChatSidebar();

      expect(screen.getByTestId('create-chat-button')).toBeInTheDocument();
    });

    it('点击新建聊天按钮应该创建新聊天', async () => {
      const { pinia } = renderChatSidebar();
      const chatStore = useChatStore(pinia);
      const createSpy = vi.spyOn(chatStore, 'createChat');

      await fireEvent.click(screen.getByTestId('create-chat-button'));

      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('搜索过滤功能', () => {
    it('应该渲染搜索按钮', () => {
      renderChatSidebar();

      expect(screen.getByTestId('search-button')).toBeInTheDocument();
    });

    it('应该能够过滤聊天列表', async () => {
      vi.useFakeTimers();
      renderChatSidebar();

      await fireEvent.click(screen.getByTestId('search-button'));
      const filterInput = screen.getByTestId('filter-input');
      await fireEvent.update(filterInput, '聊天 1');

      // 防抖 200ms 后生效
      await vi.advanceTimersByTimeAsync(300);

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.queryByTestId('chat-button-chat-2')).not.toBeInTheDocument();
    });

    it('应该能够退出搜索模式', async () => {
      renderChatSidebar();

      await fireEvent.click(screen.getByTestId('search-button'));
      expect(screen.getByTestId('filter-input')).toBeInTheDocument();

      // 搜索态下返回按钮的 aria-label 为「搜索」（common.search）
      await fireEvent.click(screen.getByLabelText('搜索'));

      expect(screen.queryByTestId('filter-input')).not.toBeInTheDocument();
    });
  });

  describe('选择聊天功能', () => {
    it('应该能够点击聊天按钮', async () => {
      renderChatSidebar();

      const chatButton = screen.getByTestId('chat-button-chat-1');
      await fireEvent.click(chatButton);

      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('最后消息预览', () => {
    it('应该显示聊天名称', () => {
      renderChatSidebar();

      const chatNames = screen.getAllByTestId('chat-name');
      expect(chatNames.length).toBe(3);
      expect(chatNames[0]).toHaveTextContent('聊天 1');
    });
  });

  describe('响应式布局模式', () => {
    it('四种布局模式下都应该正确渲染聊天按钮', () => {
      const modes = [
        { isMobile: false, isCompact: false, isCompressed: false, isDesktop: true },
        { isMobile: false, isCompact: true, isCompressed: false, isDesktop: false },
        { isMobile: false, isCompact: false, isCompressed: true, isDesktop: false },
        { isMobile: true, isCompact: false, isCompressed: false, isDesktop: false },
      ];

      for (const mode of modes) {
        mocks.responsive.__reset();
        mocks.responsive.__set(mode);
        const { unmount } = renderChatSidebar();

        expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
        expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();

        unmount();
      }
    });
  });
});

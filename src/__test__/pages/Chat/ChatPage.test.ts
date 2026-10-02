/**
 * ChatPage 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/ChatPage.test.tsx，保留核心语义：
 * - chatId URL 参数重定向逻辑（加载中/初始化错误守卫、存在选中、不存在清除）
 * - mobile/desktop 条件渲染
 * - 侧边栏折叠动画样式（桌面/平板）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';

// ========================================
// Mock 模块配置（hoisting 限制，通过 vi.hoisted 共享可变状态）
// ========================================

const mocks = vi.hoisted(() => {
  /** 可变的响应式 mock（Ref 形状，与真实 useResponsive 一致） */
  const responsive = globalThis.__createResponsiveMock();
  /** 可变的路由 query */
  const query: Record<string, string> = {};
  return { responsive, query };
});

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.query }),
}));

const mockClearChatIdParam = vi.fn();
const mockNavigateToChat = vi.fn();
vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
    clearChatIdParam: mockClearChatIdParam,
  }),
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

// Mock 子组件：ChatPage 测试聚焦 URL 重定向与条件渲染，不测子组件内部行为
vi.mock('@/pages/Chat/components/Sidebar/ChatSidebar.vue', () => ({
  default: { template: '<div data-testid="mock-sidebar">Sidebar</div>' },
}));
vi.mock('@/pages/Chat/components/Content/Content.vue', () => ({
  default: { template: '<div data-testid="mock-content">Content</div>' },
}));
vi.mock('@/components/MobileDrawer', () => ({
  MobileDrawer: {
    props: ['open', 'showCloseButton'],
    template: '<div data-testid="mock-mobile-drawer"><slot /></div>',
  },
}));

// Mock 存储与 SDK 预加载（setSelectedChatIdWithPreload 内部依赖）
vi.mock('@/store/storage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatIndex: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: vi.fn(() => Promise.resolve(undefined)),
  deleteChatFromStorage: vi.fn(() => Promise.resolve(undefined)),
  migrateOldChatStorage: vi.fn(() => Promise.resolve(undefined)),
  loadModelsFromJson: vi.fn(() => Promise.resolve([])),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
}));
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    preloadProviders: vi.fn(() => Promise.resolve()),
    loadProvider: vi.fn(),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
  }),
}));

import ChatPage from '@/pages/Chat/index.vue';
import { createAppPinia } from '@/stores';
import { useChatStore, useChatPageStore } from '@/stores';
import type { ChatMeta } from '@/types/chat';

/** 创建测试聊天元数据 */
const createPageMeta = (id: string): ChatMeta => ({
  id,
  name: `测试聊天${id}`,
  modelIds: [],
  isDeleted: false,
});

/** 填充 chatStore 的聊天元数据与活跃数据 */
function seedChatStore(pinia: ReturnType<typeof createAppPinia>) {
  const chatStore = useChatStore(pinia);
  chatStore.chatMetaList = [createPageMeta('chat-1')];
  chatStore.activeChatData = {
    'chat-1': { id: 'chat-1', name: '测试聊天1', chatModelList: [], isDeleted: false },
    'chat-2': { id: 'chat-2', name: '测试聊天2', chatModelList: [], isDeleted: true },
  };
}

/** 渲染 ChatPage（每用例独立 pinia，返回渲染结果与 pinia 供断言） */
function renderChatPage() {
  const pinia = createAppPinia();
  seedChatStore(pinia);
  const result = render(ChatPage, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

describe('ChatPage（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 复位可变 mock 状态
    mocks.responsive.__reset();
    for (const key of Object.keys(mocks.query)) delete mocks.query[key];
  });

  describe('chatId URL 重定向', () => {
    it('不应该执行重定向 当聊天列表正在加载', async () => {
      const pinia = createAppPinia();
      seedChatStore(pinia);
      useChatStore(pinia).loading = true;
      mocks.query.chatId = 'chat-1';

      render(ChatPage, { global: { plugins: [pinia] } });

      await waitFor(() => {
        expect(mockClearChatIdParam).not.toHaveBeenCalled();
      });
      expect(useChatStore(pinia).selectedChatId).toBeNull();
    });

    it('不应该执行重定向 当存在初始化错误', async () => {
      const pinia = createAppPinia();
      seedChatStore(pinia);
      const chatStore = useChatStore(pinia);
      chatStore.loading = false;
      chatStore.initializationError = '加载失败';
      mocks.query.chatId = 'chat-1';

      render(ChatPage, { global: { plugins: [pinia] } });

      await waitFor(() => {
        expect(mockClearChatIdParam).not.toHaveBeenCalled();
      });
      expect(chatStore.selectedChatId).toBeNull();
    });

    it('应该选中聊天 当 chatId 对应的聊天存在且未删除', async () => {
      mocks.query.chatId = 'chat-1';
      const { pinia } = renderChatPage();

      await waitFor(() => {
        expect(useChatStore(pinia).selectedChatId).toBe('chat-1');
      });
      expect(mockClearChatIdParam).not.toHaveBeenCalled();
    });

    it('应该清除 chatId 参数 当聊天已被删除（不在元数据列表）', async () => {
      mocks.query.chatId = 'chat-2';
      renderChatPage();

      await waitFor(() => {
        expect(mockClearChatIdParam).toHaveBeenCalledOnce();
      });
    });

    it('应该清除 chatId 参数 当聊天不存在', async () => {
      mocks.query.chatId = 'nonexistent';
      renderChatPage();

      await waitFor(() => {
        expect(mockClearChatIdParam).toHaveBeenCalledOnce();
      });
    });

    it('应该在无 chatId 参数时不执行任何重定向', async () => {
      renderChatPage();

      await waitFor(() => {
        expect(mockClearChatIdParam).not.toHaveBeenCalled();
      });
    });
  });

  describe('mobile/desktop 条件渲染', () => {
    it('应该渲染 MobileDrawer 当 isMobile 为 true', async () => {
      mocks.responsive.__set({ isMobile: true });

      renderChatPage();

      expect(screen.getByTestId('mock-mobile-drawer')).toBeInTheDocument();
      expect(
        screen.queryByTestId('chat-sidebar-wrapper'),
      ).not.toBeInTheDocument();
    });

    it('应该直接渲染侧边栏 当 isMobile 为 false', async () => {
      renderChatPage();

      expect(
        screen.queryByTestId('mock-mobile-drawer'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('chat-sidebar-wrapper')).toBeInTheDocument();
    });

    it('应该在侧边栏折叠 + 桌面端时应用隐藏样式', async () => {
      const pinia = createAppPinia();
      seedChatStore(pinia);
      useChatPageStore(pinia).isSidebarCollapsed = true;

      render(ChatPage, { global: { plugins: [pinia] } });

      const sidebar = screen.getByTestId('chat-sidebar-wrapper');
      expect(sidebar.className).toContain('-ml-56');
      expect(sidebar.className).toContain('-translate-x-full');
    });

    it('应该在侧边栏折叠 + 平板端时应用平板隐藏样式', async () => {
      mocks.responsive.__set({ isCompact: true, isDesktop: false });
      const pinia = createAppPinia();
      seedChatStore(pinia);
      useChatPageStore(pinia).isSidebarCollapsed = true;

      render(ChatPage, { global: { plugins: [pinia] } });

      const sidebar = screen.getByTestId('chat-sidebar-wrapper');
      expect(sidebar.className).toContain('-ml-48');
      expect(sidebar.className).toContain('w-48');
    });

    it('应该在侧边栏展开 + 平板端时应用平板宽度', async () => {
      mocks.responsive.__set({ isCompact: true, isDesktop: false });

      renderChatPage();

      const sidebar = screen.getByTestId('chat-sidebar-wrapper');
      expect(sidebar.className).toContain('w-48');
      expect(sidebar.className).toContain('ml-0');
    });
  });
});

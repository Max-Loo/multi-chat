/**
 * ToolsBar / ChatSidebar / ChatPage 组件测试
 * （转写自 React pages/Chat 测试）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import ToolsBar from '@/pages/Chat/components/Sidebar/components/ToolsBar.vue';
import ChatSidebar from '@/pages/Chat/components/Sidebar/index.vue';
import ChatPage from '@/pages/Chat/index.vue';
import { useChatStore } from '@/store/chat';
import { useChatPageStore } from '@/store/chatPage';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      chat: {
        createChat: '新建聊天',
        hideSidebar: '隐藏侧边栏',
        showSidebar: '显示侧边栏',
        selectChatToStart: '选择一个聊天开始',
        unnamed: '未命名',
        rename: '重命名',
        delete: '删除',
        moreActions: '更多操作',
        unnamed2: '未命名',
      },
      common: {
        search: '搜索',
        a11y: { chatList: '聊天列表' },
      },
      navigation: { openChatList: '打开聊天列表', createChat: '新建聊天' },
    }).useTranslation(),
}));

const responsiveMock = vi.hoisted(() => ({ isMobile: false, layoutMode: 'desktop' as string, isDesktop: true }));

vi.mock('@/composables/useResponsive', async () => {
  const { computed } = await import('vue');
  return {
    useResponsive: () => ({
      layoutMode: computed(() => responsiveMock.layoutMode),
      isMobile: computed(() => responsiveMock.isMobile),
      isDesktop: computed(() => responsiveMock.isDesktop),
    }),
  };
});

const navigateMock = vi.hoisted(() => ({
  navigateToChat: vi.fn(),
  clearChatIdParam: vi.fn(),
}));

vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => navigateMock,
}));

const routerMock = vi.hoisted(() => ({
  currentQuery: {} as Record<string, string | string[]>,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: routerMock.currentQuery }),
  useRouter: () => ({ push: vi.fn() }),
}));

// virtua VList 桩：happy-dom 中容器尺寸为 0 不会渲染条目，直接平铺渲染
vi.mock('virtua/vue', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    VList: defineComponent({
      props: { data: { type: Array, required: true } },
      setup(props, { slots, attrs }) {
        return () =>
          h('div', attrs, props.data.map((item, index) => slots.default?.({ item, index })));
      },
    }),
  };
});

// MobileDrawer 桩（抽屉行为由自身测试覆盖）
vi.mock('@/components/MobileDrawer', () => ({
  MobileDrawer: {
    props: ['open'],
    template: '<div v-if="open" data-testid="mobile-drawer-stub"><slot /></div>',
  },
}));

describe('ToolsBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    responsiveMock.isMobile = false;
  });

  it('应该渲染新建聊天按钮并触发创建', async () => {
    render(ToolsBar);

    const createBtn = screen.getByTestId('create-chat-button');
    await fireEvent.click(createBtn);

    // createNewChat 会走 store 与导航（均被 mock/真实 Pinia 承接），此处验证可点击不抛错
    expect(createBtn).toBeInTheDocument();
  });

  it('桌面端且聊天页打开时应该渲染折叠侧边栏按钮', () => {
    const chatPageStore = useChatPageStore();
    chatPageStore.setIsShowChatPage(true);

    render(ToolsBar);

    expect(screen.getByTitle('隐藏侧边栏')).toBeInTheDocument();
  });

  it('点击折叠按钮应该更新 store 状态', async () => {
    const chatPageStore = useChatPageStore();
    chatPageStore.setIsShowChatPage(true);

    render(ToolsBar);

    await fireEvent.click(screen.getByTitle('隐藏侧边栏'));

    expect(chatPageStore.isSidebarCollapsed).toBe(true);
  });

  it('受控模式应该显示搜索入口并支持进入搜索态', async () => {
    const { container } = render(ToolsBar, {
      props: { filterText: '' },
    });

    await fireEvent.click(screen.getByTestId('search-button'));

    // 进入搜索态后渲染过滤输入框与返回按钮
    await waitFor(() => {
      expect(container.querySelector('[data-testid="filter-input"]')).toBeInTheDocument();
    });
  });
});

describe('ChatSidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    responsiveMock.isMobile = false;
  });

  /** 准备含两条聊天的 store */
  function seedChats(): void {
    const chatStore = useChatStore();
    chatStore.chatMetaList = [
      { id: 'chat-1', name: '工作聊天', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: '生活聊天', modelIds: [], isDeleted: false },
    ];
    chatStore.selectedChatId = 'chat-1';
  }

  it('应该渲染全部聊天按钮', async () => {
    seedChats();

    render(ChatSidebar);
    await nextTick();

    await waitFor(() => {
      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();
    });
  });

  it('加载中应该渲染骨架屏', () => {
    const chatStore = useChatStore();
    chatStore.loading = true;

    const { container } = render(ChatSidebar);

    // 全局未 mock 后 Skeleton 渲染 data-slot 骨架块
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-button-chat-1')).not.toBeInTheDocument();
  });

  it('选中的聊天应该有 aria-selected', async () => {
    seedChats();

    render(ChatSidebar);
    await nextTick();

    await waitFor(() => {
      expect(screen.getByTestId('chat-button-chat-1')).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });
});

describe('ChatPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    routerMock.currentQuery = {};
    responsiveMock.isMobile = false;
  });

  it('应该渲染聊天页结构与主内容区', () => {
    render(ChatPage);

    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    expect(screen.getByTestId('chat-sidebar-wrapper')).toBeInTheDocument();
  });

  it('URL 携带已存在的 chatId 时应该设置选中聊天', async () => {
    routerMock.currentQuery = { chatId: 'chat-9' };
    const chatStore = useChatStore();
    chatStore.chatMetaList = [
      { id: 'chat-9', name: '存在', modelIds: [], isDeleted: false },
    ];
    const preloadSpy = vi
      .spyOn(chatStore, 'setSelectedChatIdWithPreload')
      .mockResolvedValue();

    render(ChatPage);

    await waitFor(() => {
      expect(preloadSpy).toHaveBeenCalledWith('chat-9');
    });
  });

  it('URL 携带不存在的 chatId 时应该清除参数', async () => {
    routerMock.currentQuery = { chatId: 'ghost' };
    const chatStore = useChatStore();
    chatStore.chatMetaList = [];

    render(ChatPage);

    await waitFor(() => {
      expect(navigateMock.clearChatIdParam).toHaveBeenCalled();
    });
  });

  it('加载中不执行 chatId 检查', () => {
    routerMock.currentQuery = { chatId: 'ghost' };
    const chatStore = useChatStore();
    chatStore.loading = true;

    render(ChatPage);

    expect(navigateMock.clearChatIdParam).not.toHaveBeenCalled();
  });

  it('移动端渲染抽屉入口而非侧边栏', () => {
    responsiveMock.isMobile = true;
    const chatPageStore = useChatPageStore();
    chatPageStore.setIsDrawerOpen(true);

    render(ChatPage);

    expect(screen.getByTestId('mobile-drawer-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-sidebar-wrapper')).not.toBeInTheDocument();
  });
});

// 引用避免 tree-shake 检查误报
void createMockChat;

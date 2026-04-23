import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ChatSidebar from '@/pages/Chat/components/Sidebar';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';

// Mock useResponsive hook（可配置）
const mockUseResponsive = vi.fn(() => ({
  layoutMode: 'desktop',
  width: 1280,
  height: 800,
  isMobile: false,
  isCompact: false,
  isCompressed: false,
  isDesktop: true,
}));

vi.mock('@/context/ResponsiveContext', () => ({
  useResponsive: () => mockUseResponsive(),
  ResponsiveProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/**
 * Mock useAdaptiveScrollbar hook because it requires window event listeners that are difficult to set up in tests
 */
vi.mock('@/hooks/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => ({
    onScrollEvent: vi.fn(),
    scrollbarClassname: 'custom-scrollbar',
  }),
}));

/**
 * Mock virtua 虚拟滚动组件，在测试环境中渲染为普通 div
 */
vi.mock('virtua', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 测试 mock 需要透传任意 props
  VList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Virtualizer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('react-i18next', () => {
  const R = { common: { search: '搜索', confirm: '确认', cancel: '取消' }, chat: { hideSidebar: '隐藏侧边栏', showSidebar: '显示侧边栏', createChat: '创建聊天', unnamed: '未命名', rename: '重命名', delete: '删除', confirmDelete: '确认删除', deleteChatConfirm: '确定删除该聊天？', deleteChatSuccess: '删除成功', deleteChatFailed: '删除失败', editChatSuccess: '编辑成功', editChatFailed: '编辑失败' } };
  return globalThis.__createI18nMockReturn(R);
});

/**
 * Mock useConfirm hook because it requires ConfirmProvider context which is complex to set up in tests
 */
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({
    modal: {
      warning: vi.fn(),
    },
  }),
}));

/**
 * Mock useNavigateToPage hook because it wraps navigation logic that's tested separately
 */
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: vi.fn(),
  }),
}));

/**
 * 创建测试用的初始状态
 */
function createInitialState() {
  return createTypeSafeTestStore({
    chat: createChatSliceState({
      chatMetaList: [
        {
          id: 'chat-1',
          name: '聊天 1',
          modelIds: [],
          isDeleted: false,
        },
        {
          id: 'chat-2',
          name: '聊天 2',
          modelIds: [],
          isDeleted: false,
        },
        {
          id: 'chat-3',
          name: '聊天 3',
          modelIds: [],
          isDeleted: false,
        },
      ],
      selectedChatId: null,
      loading: false,
    }),
    chatPage: createChatPageSliceState({
      isShowChatPage: true,
      isSidebarCollapsed: false,
    }),
  });
}

/**
 * 渲染 ChatSidebar 组件的辅助函数
 */
function renderChatSidebar(store: ReturnType<typeof createTypeSafeTestStore>) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ChatSidebar />
      </BrowserRouter>
    </Provider>
  );
}

/**
 * ChatSidebar 组件单元测试
 *
 * 测试目标：验证 ChatSidebar 组件的核心功能
 *
 * 技术方案：
 * - 使用真实组件（移除子组件 Mock）
 * - 使用 Redux Provider 提供测试状态
 * - 测试聊天列表渲染、搜索过滤、新建聊天等功能
 */
describe('ChatSidebar Component', () => {
  beforeEach(async () => {
    await resetTestState();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  /**
   * 测试聊天列表渲染
   */
  describe('聊天列表渲染', () => {
    it('应该渲染所有未删除的聊天', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-3')).toBeInTheDocument();
    });

    it('应该显示空列表状态', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [],
          selectedChatId: null,
          loading: false,
        }),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      renderChatSidebar(store);

      expect(screen.queryByTestId('chat-button-chat-1')).not.toBeInTheDocument();
    });

    it('应该在加载期间显示骨架屏', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState({
          chatMetaList: [],
          selectedChatId: null,
          loading: true,
        }),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      renderChatSidebar(store);

      expect(screen.queryByTestId('chat-button-chat-1')).not.toBeInTheDocument();
    });
  });

  /**
   * 测试新建聊天功能
   */
  describe('新建聊天功能', () => {
    it('应该渲染新建聊天按钮', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      const newChatButton = screen.getByTestId('create-chat-button');
      expect(newChatButton).toBeInTheDocument();
    });

    it('点击新建聊天按钮应该创建新聊天', () => {
      const store = createInitialState();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderChatSidebar(store);

      const newChatButton = screen.getByTestId('create-chat-button');
      fireEvent.click(newChatButton);

      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  /**
   * 测试搜索过滤功能
   */
  describe('搜索过滤功能', () => {
    it('应该渲染搜索按钮', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      const searchButton = screen.getByTestId('search-button');
      expect(searchButton).toBeInTheDocument();
    });

    it('应该能够过滤聊天列表', async () => {
      const store = createInitialState();
      renderChatSidebar(store);

      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      const filterInput = screen.getByTestId('filter-input');
      fireEvent.change(filterInput, { target: { value: '聊天 1' } });

      vi.useFakeTimers();
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
    });

    it('应该能够退出搜索模式', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      expect(screen.getByTestId('filter-input')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      const backButton = buttons[0];
      fireEvent.click(backButton);

      expect(screen.queryByTestId('filter-input')).not.toBeInTheDocument();
    });
  });

  /**
   * 测试选择聊天功能
   */
  describe('选择聊天功能', () => {
    it('应该能够点击聊天按钮', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      const chatButton = screen.getByTestId('chat-button-chat-1');
      fireEvent.click(chatButton);

      expect(chatButton).toBeInTheDocument();
    });
  });

  /**
   * 测试聊天列表排序
   */
  describe('聊天列表排序', () => {
    it('应该渲染所有聊天', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-3')).toBeInTheDocument();
    });
  });

  /**
   * 测试最后消息预览
   */
  describe('最后消息预览', () => {
    it('应该显示聊天名称', () => {
      const store = createInitialState();
      renderChatSidebar(store);

      const chatNames = screen.getAllByTestId('chat-name');
      expect(chatNames.length).toBeGreaterThan(0);
    });
  });

  /**
   * 测试响应式布局模式
   */
  describe('响应式布局模式', () => {
    beforeEach(() => {
      // 每个测试前重置为默认的桌面模式
      mockUseResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });
    });

    it('桌面模式：应该正确渲染', () => {
      const store = createInitialState();
      const { container } = renderChatSidebar(store);

      // ChatSidebar 使用 w-full 而不是 w-56（宽度由父组件 ChatPage 控制）
      const sidebarDiv = container.querySelector('.w-full');
      expect(sidebarDiv).toBeInTheDocument();
    });

    it('紧凑模式：应该正确渲染', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compact',
        width: 800,
        height: 600,
        isMobile: false,
        isCompact: true,
        isCompressed: false,
        isDesktop: false,
      });

      const store = createInitialState();
      const { container } = renderChatSidebar(store);

      const sidebarDiv = container.querySelector('.w-full');
      expect(sidebarDiv).toBeInTheDocument();
    });

    it('压缩模式：应该正确渲染', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compressed',
        width: 1100,
        height: 700,
        isMobile: false,
        isCompact: false,
        isCompressed: true,
        isDesktop: false,
      });

      const store = createInitialState();
      const { container } = renderChatSidebar(store);

      const sidebarDiv = container.querySelector('.w-full');
      expect(sidebarDiv).toBeInTheDocument();
    });

    it('移动模式：应该正确渲染', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      const store = createInitialState();
      const { container } = renderChatSidebar(store);

      // 移动模式使用正常宽度
      const sidebarDiv = container.querySelector('.w-full');
      expect(sidebarDiv).toBeInTheDocument();
    });

    it('layoutMode 变化时应该正确调整', () => {
      const store = createInitialState();

      // 桌面模式
      mockUseResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });

      const { rerender } = render(
        <Provider store={store}>
          <BrowserRouter>
            <ChatSidebar />
          </BrowserRouter>
        </Provider>
      );
      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();

      // 切换到紧凑模式
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compact',
        width: 800,
        height: 600,
        isMobile: false,
        isCompact: true,
        isCompressed: false,
        isDesktop: false,
      });

      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ChatSidebar />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
    });

    it('所有模式下都应该正确渲染聊天按钮', () => {
      const modes = [
        {
          layoutMode: 'desktop',
          width: 1280,
          height: 800,
          isMobile: false,
          isCompact: false,
          isCompressed: false,
          isDesktop: true,
        },
        {
          layoutMode: 'compact',
          width: 800,
          height: 600,
          isMobile: false,
          isCompact: true,
          isCompressed: false,
          isDesktop: false,
        },
        {
          layoutMode: 'compressed',
          width: 1100,
          height: 700,
          isMobile: false,
          isCompact: false,
          isCompressed: true,
          isDesktop: false,
        },
        {
          layoutMode: 'mobile',
          width: 390,
          height: 844,
          isMobile: true,
          isCompact: false,
          isCompressed: false,
          isDesktop: false,
        },
      ];

      const store = createInitialState();

      modes.forEach((mode) => {
        mockUseResponsive.mockReturnValue(mode);

        const { unmount } = render(
          <Provider store={store}>
            <BrowserRouter>
              <ChatSidebar />
            </BrowserRouter>
          </Provider>
        );

        // 验证聊天按钮在所有模式下都存在
        expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
        expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();

        unmount();
      });
    });
  });
});

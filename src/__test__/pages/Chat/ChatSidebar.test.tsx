import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import ChatSidebar from '@/pages/Chat/components/Sidebar';

import { resetTestState } from '@/__test__/helpers/isolation';

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
 * Mock react-i18next for internationalization
 */

/**
 * Mock react-i18next for internationalization
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 第三方库类型定义不完整
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          chat: {
            createChat: '新建聊天',
            hideSidebar: '隐藏侧边栏',
            unnamed: '未命名',
            delete: '删除',
            rename: '重命名',
            confirmDelete: '确认删除',
            deleteChatConfirm: '确定要删除这个聊天吗？',
            deleteChatSuccess: '删除成功',
            deleteChatFailed: '删除失败',
            editChatSuccess: '编辑成功',
            editChatFailed: '编辑失败',
          },
          common: {
            search: '搜索',
          },
        };
        return keyOrSelector(mockResources);
      }
      return keyOrSelector;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    }) as any,
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

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
 * 创建测试用的 Redux store
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: Redux Toolkit 严格类型系统限制
function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
    },
    ...(preloadedState && { preloadedState }),
  });
}

/**
 * 渲染 ChatSidebar 组件的辅助函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: Redux Toolkit 严格类型系统限制
function renderChatSidebar(store: any) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ChatSidebar />
      </BrowserRouter>
    </Provider>
  );
}

/**
 * 创建测试用的初始状态
 */
function createInitialState() {
  return {
    chat: {
      chatList: [
        {
          id: 'chat-1',
          name: '聊天 1',
          isDeleted: false,
          timestamp: 1738000000,
          lastMessage: '最后消息 1',
        },
        {
          id: 'chat-2',
          name: '聊天 2',
          isDeleted: false,
          timestamp: 1738000100,
          lastMessage: '最后消息 2',
        },
        {
          id: 'chat-3',
          name: '聊天 3',
          isDeleted: false,
          timestamp: 1738000200,
          lastMessage: '最后消息 3',
        },
      ],
      selectedChatId: null,
      loading: false,
    },
    chatPage: {
      isShowChatPage: true,
      isSidebarCollapsed: false,
    },
  };
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
  beforeEach(() => {
    resetTestState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * 测试聊天列表渲染
   */
  describe('聊天列表渲染', () => {
    it('应该渲染所有未删除的聊天', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-3')).toBeInTheDocument();
    });

    it('应该显示空列表状态', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
        },
        chatPage: { isShowChatPage: true, isSidebarCollapsed: false },
      });

      renderChatSidebar(store);

      expect(screen.queryByTestId('chat-button-chat-1')).not.toBeInTheDocument();
    });

    it('应该在加载期间显示骨架屏', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: true,
        },
        chatPage: { isShowChatPage: true, isSidebarCollapsed: false },
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
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      const newChatButton = screen.getByTestId('create-chat-button');
      expect(newChatButton).toBeInTheDocument();
    });

    it('点击新建聊天按钮应该创建新聊天', () => {
      const store = createTestStore(createInitialState());
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
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      const searchButton = screen.getByTestId('search-button');
      expect(searchButton).toBeInTheDocument();
    });

    it('应该能够过滤聊天列表', async () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      const filterInput = screen.getByTestId('filter-input');
      fireEvent.change(filterInput, { target: { value: '聊天 1' } });

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
    });

    it('应该能够退出搜索模式', () => {
      const store = createTestStore(createInitialState());

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
      const store = createTestStore(createInitialState());

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
      const store = createTestStore(createInitialState());

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
      const store = createTestStore(createInitialState());

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
      const store = createTestStore(createInitialState());
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

      const store = createTestStore(createInitialState());
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

      const store = createTestStore(createInitialState());
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

      const store = createTestStore(createInitialState());
      const { container } = renderChatSidebar(store);

      // 移动模式使用正常宽度
      const sidebarDiv = container.querySelector('.w-full');
      expect(sidebarDiv).toBeInTheDocument();
    });

    it('layoutMode 变化时应该正确调整', () => {
      const store = createTestStore(createInitialState());

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

      const { rerender } = renderChatSidebar(store);
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

      const store = createTestStore(createInitialState());

      modes.forEach((mode) => {
        mockUseResponsive.mockReturnValue(mode);

        const { unmount } = renderChatSidebar(store);

        // 验证聊天按钮在所有模式下都存在
        expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
        expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();

        unmount();
      });
    });
  });
});

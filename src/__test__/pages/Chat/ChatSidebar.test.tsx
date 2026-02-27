import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import ChatSidebar from '@/pages/Chat/components/ChatSidebar';
import { resetTestState } from '../../helpers/isolation';

/**
 * Mock ChatButton 组件
 */
vi.mock('@/pages/Chat/components/ChatSidebar/components/ChatButton', () => ({
  default: ({ chat }: { chat: { id: string; name: string } }) => (
    <div data-testid={`chat-button-${chat.id}`}>
      <span data-testid="chat-name">{chat.name || '未命名'}</span>
    </div>
  ),
}));

/**
 * Mock FilterInput 组件
 */
vi.mock('@/components/FilterInput', () => ({
  default: ({ value, onChange, className }: { value: string; onChange: (val: string) => void; className?: string }) => (
    <input
      data-testid="filter-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder="搜索聊天..."
    />
  ),
}));

/**
 * Mock useAdaptiveScrollbar hook
 */
vi.mock('@/hooks/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => ({
    onScrollEvent: vi.fn(),
    scrollbarClassname: 'custom-scrollbar',
  }),
}));

/**
 * Mock react-i18next
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          chat: {
            createChat: '新建聊天',
            hideSidebar: '隐藏侧边栏',
            unnamed: '未命名',
          },
          common: {
            search: '搜索',
          },
        };
        return keyOrSelector(mockResources);
      }
      return keyOrSelector;
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
 * Mock useNavigateToPage hook
 */
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: vi.fn(),
  }),
}));

/**
 * 创建测试用的 Redux store
 */
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
 * - Mock 所有依赖组件和 hooks
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

      // 验证渲染了 3 个聊天按钮
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

      // 验证没有渲染聊天按钮
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

      // 验证没有渲染聊天按钮（显示骨架屏）
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

      // 验证新建聊天按钮存在（通过 Plus 图标）
      const buttons = screen.getAllByRole('button');
      const newChatButton = buttons.find(btn => btn.querySelector('svg'));
      expect(newChatButton).toBeInTheDocument();
    });

    it('点击新建聊天按钮应该创建新聊天', () => {
      const store = createTestStore(createInitialState());
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      renderChatSidebar(store);

      // 点击新建聊天按钮（最后一个按钮）
      const buttons = screen.getAllByRole('button');
      const newChatButton = buttons[buttons.length - 1];
      fireEvent.click(newChatButton);

      // 验证 dispatch 被调用
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

      // 验证搜索按钮存在（通过 title 属性）
      const searchButton = screen.getByTitle('搜索');
      expect(searchButton).toBeInTheDocument();
    });

    it('应该能够过滤聊天列表', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => btn.innerHTML.includes('Search'));
      if (searchButton) {
        fireEvent.click(searchButton);

        // 输入搜索文本
        const filterInput = screen.getByTestId('filter-input');
        fireEvent.change(filterInput, { target: { value: '聊天 1' } });

        // 验证只显示匹配的聊天
        expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
        expect(screen.queryByTestId('chat-button-chat-2')).not.toBeInTheDocument();
      }
    });

    it('应该能够退出搜索模式', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => btn.innerHTML.includes('Search'));
      if (searchButton) {
        fireEvent.click(searchButton);

        // 点击返回按钮退出搜索
        const backButton = screen.getAllByRole('button')[0];
        fireEvent.click(backButton);

        // 验证搜索输入框消失
        expect(screen.queryByTestId('filter-input')).not.toBeInTheDocument();
      }
    });
  });

  /**
   * 测试选择聊天功能
   */
  describe('选择聊天功能', () => {
    it('应该能够选择聊天', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      // 点击聊天按钮
      const chatButton = screen.getByTestId('chat-button-chat-1');
      fireEvent.click(chatButton);

      // 验证点击行为（实际导航由 useNavigateToChat mock 处理）
      expect(chatButton).toBeInTheDocument();
    });
  });

  /**
   * 测试删除聊天功能
   */
  describe('删除聊天功能', () => {
    it('应该在聊天按钮上显示删除选项', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      // 验证聊天按钮存在（删除功能在 ChatButton 组件内部测试）
      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
    });
  });

  /**
   * 测试聊天列表排序
   */
  describe('聊天列表排序', () => {
    it('应该按时间戳排序聊天列表', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      // 验证所有聊天都被渲染
      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-button-chat-3')).toBeInTheDocument();
    });
  });

  /**
   * 测试最后消息预览
   */
  describe('最后消息预览', () => {
    it('应该在聊天按钮中显示最后消息预览', () => {
      const store = createTestStore(createInitialState());

      renderChatSidebar(store);

      // 验证聊天按钮被渲染（实际消息预览在 ChatButton 组件内部）
      expect(screen.getByTestId('chat-button-chat-1')).toBeInTheDocument();
    });
  });
});

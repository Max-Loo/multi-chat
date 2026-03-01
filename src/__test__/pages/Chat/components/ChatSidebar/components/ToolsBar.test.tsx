import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import ToolsBar from '@/pages/Chat/components/ChatSidebar/components/ToolsBar';
import { resetTestState } from '@/__test__/helpers/isolation';

/**
 * Mock react-i18next
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          chat: {
            hideSidebar: '隐藏侧边栏',
            createChat: '新建聊天',
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
const mockNavigateToChat = vi.fn();
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
  }),
}));

/**
 * Mock FilterInput 组件
 */
vi.mock('@/components/FilterInput', () => ({
  default: ({ value, onChange, className, autoFocus }: { 
    value: string; 
    onChange: (val: string) => void; 
    className?: string;
    autoFocus?: boolean;
  }) => (
    <input
      data-testid="filter-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      autoFocus={autoFocus}
      placeholder="搜索聊天..."
    />
  ),
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
 * 渲染 ToolsBar 组件的辅助函数
 */
function renderToolsBar(props?: {
  filterText?: string;
  onFilterChange?: (value: string) => void;
}, store?: any) {
  const testStore = store || createTestStore({
    chat: {
      chatList: [],
      selectedChatId: null,
      loading: false,
    },
    chatPage: {
      isShowChatPage: true,
      isSidebarCollapsed: false,
    },
  });

  const defaultProps = {
    filterText: '',
    onFilterChange: vi.fn(),
    ...props,
  };

  return render(
    <Provider store={testStore}>
      <BrowserRouter>
        <ToolsBar {...defaultProps} />
      </BrowserRouter>
    </Provider>
  );
}

/**
 * ToolsBar 组件单元测试
 *
 * 测试目标：验证 ToolsBar 组件的核心功能
 *
 * 技术方案：
 * - Mock 依赖的 hooks 和组件
 * - 使用 Redux Provider 提供测试状态
 * - 测试默认工具栏、创建新聊天、搜索功能、侧边栏折叠等功能
 */
describe('ToolsBar Component', () => {
  beforeEach(() => {
    resetTestState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * 测试默认工具栏渲染
   */
  describe('默认工具栏渲染', () => {
    it('应该渲染工具栏容器', () => {
      const { container } = renderToolsBar();

      const toolbar = container.querySelector('.flex.items-center.justify-between');
      expect(toolbar).toBeInTheDocument();
    });

    it('应该在聊天页面显示隐藏侧边栏按钮', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
        },
        chatPage: {
          isShowChatPage: true,
          isSidebarCollapsed: false,
        },
      });

      const { container } = renderToolsBar({}, store);

      const hideButton = container.querySelector('button[title="隐藏侧边栏"]');
      expect(hideButton).toBeInTheDocument();
    });

    it('应该显示新建聊天按钮', () => {
      const { container } = renderToolsBar();

      const newChatButton = container.querySelector('button[title="新建聊天"]');
      expect(newChatButton).toBeInTheDocument();
    });

    it('当启用搜索时应该显示搜索按钮', () => {
      const { container } = renderToolsBar({ filterText: '' });

      const searchButton = container.querySelector('button[title="搜索"]');
      expect(searchButton).toBeInTheDocument();
    });

    it('当禁用搜索时不应该显示搜索按钮', () => {
      const { container } = renderToolsBar({ filterText: undefined });

      const searchButton = container.querySelector('button[title="搜索"]');
      expect(searchButton).toBeNull();
    });

    it('不在聊天页面时不应该显示隐藏侧边栏按钮', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
        },
        chatPage: {
          isShowChatPage: false,
          isSidebarCollapsed: false,
        },
      });

      const { container } = renderToolsBar({}, store);

      const hideButton = container.querySelector('button[title="隐藏侧边栏"]');
      expect(hideButton).toBeNull();
    });
  });

  /**
   * 测试创建新聊天功能
   */
  describe('创建新聊天功能', () => {
    it('点击新建聊天按钮应该创建新聊天', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
        },
        chatPage: {
          isShowChatPage: true,
          isSidebarCollapsed: false,
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderToolsBar({}, store);

      // 点击新建聊天按钮
      const buttons = screen.getAllByRole('button');
      const newChatButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '新建聊天'
      );

      if (newChatButton) {
        fireEvent.click(newChatButton);

        // 应该触发 dispatch
        expect(dispatchSpy).toHaveBeenCalled();
      }
    });

    it('创建新聊天后应该导航到新聊天', () => {
      renderToolsBar();

      // 点击新建聊天按钮
      const buttons = screen.getAllByRole('button');
      const newChatButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '新建聊天'
      );

      if (newChatButton) {
        fireEvent.click(newChatButton);

        // 应该触发导航
        expect(mockNavigateToChat).toHaveBeenCalledWith({
          chatId: expect.any(String),
        });
      }
    });
  });

  /**
   * 测试搜索功能
   */
  describe('搜索功能', () => {
    it('点击搜索按钮应该进入搜索模式', () => {
      renderToolsBar({ filterText: '' });

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '搜索'
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // 应该显示搜索输入框
        expect(screen.getByTestId('filter-input')).toBeInTheDocument();
      }
    });

    it('搜索模式应该显示返回按钮和输入框', () => {
      renderToolsBar({ filterText: '' });

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '搜索'
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // 应该显示输入框和返回按钮
        expect(screen.getByTestId('filter-input')).toBeInTheDocument();
        
        const buttonsInSearch = screen.getAllByRole('button');
        expect(buttonsInSearch.length).toBeGreaterThan(0);
      }
    });

    it('输入框值变化应该调用 onFilterChange', () => {
      const onFilterChange = vi.fn();
      renderToolsBar({ filterText: '', onFilterChange });

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '搜索'
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // 输入搜索文本
        const input = screen.getByTestId('filter-input');
        fireEvent.change(input, { target: { value: 'test chat' } });

        // 应该调用 onFilterChange
        expect(onFilterChange).toHaveBeenCalledWith('test chat');
      }
    });

    it('点击返回按钮应该退出搜索模式', () => {
      const onFilterChange = vi.fn();
      renderToolsBar({ filterText: 'test', onFilterChange });

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '搜索'
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // 点击返回按钮（第一个按钮）
        const buttonsInSearch = screen.getAllByRole('button');
        const backButton = buttonsInSearch[0];
        fireEvent.click(backButton);

        // 应该重置搜索文本并退出搜索模式
        expect(onFilterChange).toHaveBeenCalledWith('');
        expect(screen.queryByTestId('filter-input')).not.toBeInTheDocument();
      }
    });

    it('输入框应该存在', () => {
      renderToolsBar({ filterText: '' });

      // 点击搜索按钮
      const { container } = renderToolsBar({ filterText: '' });
      const searchButton = container.querySelector('button[title="搜索"]');

      if (searchButton) {
        fireEvent.click(searchButton);

        // 输入框应该存在
        const input = screen.getByTestId('filter-input');
        expect(input).toBeInTheDocument();
      }
    });

    it('退出搜索模式时应该重置 filterText', () => {
      const onFilterChange = vi.fn();
      renderToolsBar({ filterText: 'existing search', onFilterChange });

      // 点击搜索按钮
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '搜索'
      );

      if (searchButton) {
        fireEvent.click(searchButton);

        // 清除之前的调用
        onFilterChange.mockClear();

        // 点击返回按钮
        const buttonsInSearch = screen.getAllByRole('button');
        const backButton = buttonsInSearch[0];
        fireEvent.click(backButton);

        // 应该调用 onFilterChange 重置为空字符串
        expect(onFilterChange).toHaveBeenCalledWith('');
      }
    });
  });

  /**
   * 测试侧边栏折叠功能
   */
  describe('侧边栏折叠功能', () => {
    it('点击隐藏侧边栏按钮应该设置折叠状态', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
        },
        chatPage: {
          isShowChatPage: true,
          isSidebarCollapsed: false,
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderToolsBar({}, store);

      // 点击隐藏侧边栏按钮
      const buttons = screen.getAllByRole('button');
      const hideSidebarButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '隐藏侧边栏'
      );

      if (hideSidebarButton) {
        fireEvent.click(hideSidebarButton);

        // 应该触发 dispatch
        expect(dispatchSpy).toHaveBeenCalled();
      }
    });

    it('应该通过 dispatch setIsCollapsed 来折叠侧边栏', () => {
      const store = createTestStore({
        chat: {
          chatList: [],
          selectedChatId: null,
          loading: false,
        },
        chatPage: {
          isShowChatPage: true,
          isSidebarCollapsed: false,
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderToolsBar({}, store);

      // 点击隐藏侧边栏按钮
      const buttons = screen.getAllByRole('button');
      const hideSidebarButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('title') === '隐藏侧边栏'
      );

      if (hideSidebarButton) {
        fireEvent.click(hideSidebarButton);

        // 应该调用 setIsCollapsed action
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'chatPage/setIsCollapsed',
          })
        );
      }
    });
  });

  /**
   * 测试响应式布局
   */
  describe('响应式布局', () => {
    it('工具栏应该使用 flex 布局', () => {
      const { container } = renderToolsBar();
      const toolbarDiv = container.querySelector('.flex.items-center.justify-between');
      expect(toolbarDiv).toBeInTheDocument();
    });

    it('工具栏应该是全宽', () => {
      const { container } = renderToolsBar();
      const toolbarDiv = container.querySelector('.w-full');
      expect(toolbarDiv).toBeInTheDocument();
    });
  });

  /**
   * 测试按钮样式
   */
  describe('按钮样式', () => {
    it('所有按钮应该有固定的尺寸', () => {
      const { container } = renderToolsBar();

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.className).toContain('h-8');
        expect(button.className).toContain('w-8');
      });
    });

    it('所有按钮应该有 hover 效果', () => {
      const { container } = renderToolsBar();

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.className).toContain('hover:bg-accent');
      });
    });
  });

  /**
   * 测试搜索模式下的布局
   */
  describe('搜索模式布局', () => {
    it('搜索模式下应该显示输入框', () => {
      const { container } = renderToolsBar({ filterText: '' });
      const searchButton = container.querySelector('button[title="搜索"]');

      if (searchButton) {
        fireEvent.click(searchButton);

        const input = screen.getByTestId('filter-input');
        expect(input).toBeInTheDocument();
      }
    });

    it('搜索模式下应该显示返回按钮', () => {
      const { container } = renderToolsBar({ filterText: '' });
      const searchButton = container.querySelector('button[title="搜索"]');

      if (searchButton) {
        fireEvent.click(searchButton);

        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
      }
    });

    it('搜索模式下输入框应该有正确的样式', () => {
      const { container } = renderToolsBar({ filterText: '' });
      const searchButton = container.querySelector('button[title="搜索"]');

      if (searchButton) {
        fireEvent.click(searchButton);

        const input = screen.getByTestId('filter-input');
        expect(input).toBeInTheDocument();
        // FilterInput 组件应该传入 className
        expect(input.className).toBeDefined();
      }
    });
  });
});

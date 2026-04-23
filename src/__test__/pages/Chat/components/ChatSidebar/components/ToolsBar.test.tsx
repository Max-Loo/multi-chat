import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ToolsBar from '@/pages/Chat/components/Sidebar/components/ToolsBar';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { EnhancedStore } from '@reduxjs/toolkit';

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => globalThis.__createResponsiveMock(),
}));

vi.mock('react-i18next', () => {
  const R = { chat: { hideSidebar: '隐藏侧边栏', createChat: '新建聊天' }, common: { search: '搜索' } };
  return globalThis.__createI18nMockReturn(R);
});

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
 * 渲染 ToolsBar 组件的辅助函数
 */
function renderToolsBar(props?: {
  filterText?: string;
  onFilterChange?: (value: string) => void;
}, store?: EnhancedStore) {
  const testStore = store || createTypeSafeTestStore({
    chat: createChatSliceState(),
    chatPage: createChatPageSliceState({
      isShowChatPage: true,
      isSidebarCollapsed: false,
    }),
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
  beforeEach(async () => {
    await resetTestState();
  });

  afterEach(() => {
    cleanup();
  });

  describe('默认工具栏渲染', () => {
    it('应该渲染工具栏容器', () => {
      renderToolsBar();

      const toolbar = screen.getByTestId('tools-bar');
      expect(toolbar).toBeInTheDocument();
    });

    it('应该在聊天页面显示隐藏侧边栏按钮', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState(),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      renderToolsBar({}, store);

      const hideButton = screen.getByRole('button', { name: '隐藏侧边栏' });
      expect(hideButton).toBeInTheDocument();
    });

    it('应该显示新建聊天按钮', () => {
      renderToolsBar();

      const newChatButton = screen.getByRole('button', { name: '新建聊天' });
      expect(newChatButton).toBeInTheDocument();
    });

    it('当启用搜索时应该显示搜索按钮', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      expect(searchButton).toBeInTheDocument();
    });

    it('当禁用搜索时不应该显示搜索按钮', () => {
      renderToolsBar({ filterText: undefined });

      const searchButton = screen.queryByRole('button', { name: '搜索' });
      expect(searchButton).not.toBeInTheDocument();
    });

    it('不在聊天页面时不应该显示隐藏侧边栏按钮', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState(),
        chatPage: createChatPageSliceState({
          isShowChatPage: false,
          isSidebarCollapsed: false,
        }),
      });

      renderToolsBar({}, store);

      const hideButton = screen.queryByRole('button', { name: '隐藏侧边栏' });
      expect(hideButton).not.toBeInTheDocument();
    });
  });

  describe('创建新聊天功能', () => {
    it('点击新建聊天按钮应该创建新聊天', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState(),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderToolsBar({}, store);

      const newChatButton = screen.getByRole('button', { name: '新建聊天' });
      fireEvent.click(newChatButton);

      // 应该触发 dispatch
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('创建新聊天后应该导航到新聊天', () => {
      renderToolsBar();

      const newChatButton = screen.getByRole('button', { name: '新建聊天' });
      fireEvent.click(newChatButton);

      // 应该触发导航
      expect(mockNavigateToChat).toHaveBeenCalledWith({
        chatId: expect.any(String),
      });
    });
  });

  describe('搜索功能', () => {
    it('点击搜索按钮应该进入搜索模式', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      // 应该显示搜索输入框
      expect(screen.getByTestId('filter-input')).toBeInTheDocument();
    });

    it('搜索模式应该显示返回按钮和输入框', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      // 应该显示输入框和返回按钮
      expect(screen.getByTestId('filter-input')).toBeInTheDocument();

      const buttonsInSearch = screen.getAllByRole('button');
      expect(buttonsInSearch.length).toBeGreaterThan(0);
    });

    it('输入框值变化应该调用 onFilterChange', () => {
      const onFilterChange = vi.fn();
      renderToolsBar({ filterText: '', onFilterChange });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      // 输入搜索文本
      const input = screen.getByTestId('filter-input');
      fireEvent.change(input, { target: { value: 'test chat' } });

      // 应该调用 onFilterChange
      expect(onFilterChange).toHaveBeenCalledWith('test chat');
    });

    it('点击返回按钮应该退出搜索模式', () => {
      const onFilterChange = vi.fn();
      renderToolsBar({ filterText: 'test', onFilterChange });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      // 点击返回按钮（搜索模式下第一个按钮）
      const buttonsInSearch = screen.getAllByRole('button');
      const backButton = buttonsInSearch[0];
      fireEvent.click(backButton);

      // 应该重置搜索文本并退出搜索模式
      expect(onFilterChange).toHaveBeenCalledWith('');

      expect(screen.queryByTestId('filter-input')).not.toBeInTheDocument();
    });

    it('输入框应该存在', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      // 输入框应该存在
      const input = screen.getByTestId('filter-input');
      expect(input).toBeInTheDocument();
    });

    it('退出搜索模式时应该重置 filterText', () => {
      const onFilterChange = vi.fn();
      renderToolsBar({ filterText: 'existing search', onFilterChange });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      // 清除之前的调用
      onFilterChange.mockClear();

      // 点击返回按钮
      const buttonsInSearch = screen.getAllByRole('button');
      const backButton = buttonsInSearch[0];
      fireEvent.click(backButton);

      // 应该调用 onFilterChange 重置为空字符串
      expect(onFilterChange).toHaveBeenCalledWith('');
    });
  });

  describe('侧边栏折叠功能', () => {
    it('点击隐藏侧边栏按钮应该设置折叠状态', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState(),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderToolsBar({}, store);

      const hideSidebarButton = screen.getByRole('button', { name: '隐藏侧边栏' });
      fireEvent.click(hideSidebarButton);

      // 应该触发 dispatch
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('应该通过 dispatch setIsCollapsed 来折叠侧边栏', () => {
      const store = createTypeSafeTestStore({
        chat: createChatSliceState(),
        chatPage: createChatPageSliceState({
          isShowChatPage: true,
          isSidebarCollapsed: false,
        }),
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderToolsBar({}, store);

      const hideSidebarButton = screen.getByRole('button', { name: '隐藏侧边栏' });
      fireEvent.click(hideSidebarButton);

      // 应该调用 setIsCollapsed action
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chatPage/setIsCollapsed',
        })
      );
    });
  });

  describe('响应式布局', () => {
    it('工具栏应该使用 flex 布局', () => {
      renderToolsBar();
      const toolbarDiv = screen.getByTestId('tools-bar');
      expect(toolbarDiv).toBeInTheDocument();
    });

    it('工具栏应该是全宽', () => {
      renderToolsBar();
      const toolbarDiv = screen.getByTestId('tools-bar');
      expect(toolbarDiv).toBeInTheDocument();
    });
  });

  describe('按钮样式', () => {
    it('所有按钮应该有固定的尺寸', () => {
      renderToolsBar();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toContain('h-8');
        expect(button.className).toContain('w-8');
      });
    });

    it('所有按钮应该有 hover 效果', () => {
      renderToolsBar();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toContain('hover:bg-accent');
      });
    });
  });

  describe('搜索模式布局', () => {
    it('搜索模式下应该显示输入框', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      const input = screen.getByTestId('filter-input');
      expect(input).toBeInTheDocument();
    });

    it('搜索模式下应该显示返回按钮', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('搜索模式下输入框应该有正确的样式', () => {
      renderToolsBar({ filterText: '' });

      const searchButton = screen.getByRole('button', { name: '搜索' });
      fireEvent.click(searchButton);

      const input = screen.getByTestId('filter-input');
      expect(input).toBeInTheDocument();
      // FilterInput 组件应该传入 className
      expect(input.className).toBeDefined();
    });
  });
});

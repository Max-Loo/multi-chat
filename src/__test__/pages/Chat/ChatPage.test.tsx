import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ChatPage from '@/pages/Chat/index';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, { initializeChatList } from '@/store/slices/chatSlices';

/**
 * 创建可变的 mock 函数，用于在测试用例中动态修改
 */
export const mockNavigateToChat = vi.fn();
export const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

/**
 * Mock 所有使用 @ant-design/x 的组件
 */
vi.mock('@/pages/Chat/components/ChatSidebar/components/ChatButton', () => ({
  default: () => <div data-testid="chat-button">Mock ChatButton</div>,
}));

vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/ChatBubble', () => ({
  default: () => <div data-testid="chat-bubble">Mock ChatBubble</div>,
}));

vi.mock('@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/RunningChatBubble', () => ({
  default: () => <div data-testid="running-chat-bubble">Mock RunningChatBubble</div>,
}));

/**
 * Mock react-router-dom hooks
 */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

/**
 * Mock useNavigateToChat hook
 */
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
  }),
}));

/**
 * Mock react-i18next
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      // 支持选择器语法 t($ => $.common.remark)
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          table: {
            nickname: '昵称',
            modelProvider: '模型供应商',
            modelName: '模型名称',
            lastUpdateTime: '最后更新时间',
            createTime: '创建时间',
          },
          common: {
            remark: '备注',
            search: '搜索',
          },
          chat: {
            hideSidebar: '隐藏侧边栏',
          },
        };
        return keyOrSelector(mockResources);
      }
      // 支持字符串语法 t('key')
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
 * ChatPage 重定向逻辑单元测试
 *
 * 测试目标：验证 ChatPage 组件的聊天不存在重定向逻辑
 *
 * 技术方案：
 * - Mock 所有使用 @ant-design/x 的组件切断导入链路
 * - 使用可变的 mock 函数动态修改测试行为
 * - 避免 antd ES 模块在 vitest 中的兼容性问题
 */
describe('ChatPage 重定向逻辑测试', () => {
  let store: any;

  beforeEach(() => {
    // 清除所有 mock 调用记录
    vi.clearAllMocks();

    // 重置 searchParams
    mockSearchParams = new URLSearchParams();

    // 创建测试用的 Redux store
    store = configureStore({
      reducer: {
        chat: chatReducer,
        chatPage: () => ({ isSidebarCollapsed: false }),
        appConfig: () => ({}),
        models: () => ({ models: [] }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * @description 测试场景：聊天不存在时应重定向到 /chat
   */
  it('当 URL 中的 chatId 对应的聊天不存在时，应重定向到 /chat 页面', async () => {
    // 设置 URL 参数
    mockSearchParams = new URLSearchParams('chatId=non-existent-id');

    // 初始化空的聊天列表
    store.dispatch(initializeChatList.fulfilled([], ''));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(mockNavigateToChat).toHaveBeenCalledWith({ replace: true });
    });
  });

  /**
   * @description 测试场景：聊天存在时应正常加载
   */
  it('当 URL 中的 chatId 对应的聊天存在时，应正常加载不重定向', async () => {
    const mockChatId = 'existing-chat-id';

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams(`chatId=${mockChatId}`);

    // 初始化包含测试聊天 ID 的列表
    const mockChatList = [
      { id: mockChatId, name: 'Test Chat', isDeleted: false },
    ];
    store.dispatch(initializeChatList.fulfilled(mockChatList, ''));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      // 不应调用 navigate 进行重定向
      expect(mockNavigateToChat).not.toHaveBeenCalled();
      // 应正常设置选中的聊天 ID
      const state = store.getState();
      expect(state.chat.selectedChatId).toBe(mockChatId);
    });
  });

  /**
   * @description 测试场景：聊天已被删除时应重定向
   */
  it('当 URL 中的 chatId 对应的聊天已被删除时，应重定向到 /chat 页面', async () => {
    const deletedChatId = 'deleted-chat-id';

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams(`chatId=${deletedChatId}`);

    // 初始化包含已删除聊天的列表
    const mockChatList = [
      { id: deletedChatId, name: 'Deleted Chat', isDeleted: true },
    ];
    store.dispatch(initializeChatList.fulfilled(mockChatList, ''));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(mockNavigateToChat).toHaveBeenCalledWith({ replace: true });
    });
  });

  /**
   * @description 测试场景：无 chatId 参数时不执行重定向
   */
  it('当 URL 中没有 chatId 参数时，应正常加载不重定向', async () => {
    // 无 chatId 参数（默认为空 URLSearchParams）

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  /**
   * @description 测试场景：聊天列表加载期间不执行检查
   */
  it('当聊天列表正在加载时，应等待加载完成后再检查', async () => {
    // 设置 URL 参数
    mockSearchParams = new URLSearchParams('chatId=test-id');

    // 设置加载状态
    store.dispatch({ type: 'chat/initialize/pending' });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      // 加载期间不应调用 navigate
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });

    // 模拟加载完成
    store.dispatch(initializeChatList.fulfilled([], ''));

    await waitFor(() => {
      // 加载完成后应执行检查并重定向（因为列表为空）
      expect(mockNavigateToChat).toHaveBeenCalledWith({ replace: true });
    });
  });

  /**
   * @description 测试场景：防止重定向循环
   */
  it('重定向后应再次检查时不会重复重定向', async () => {
    // 无 chatId 参数

    store.dispatch(initializeChatList.fulfilled([], ''));

    const { rerender } = render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    // 第一次渲染后，不应调用 navigate（因为没有 chatId 参数）
    await waitFor(() => {
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });

    // 模拟重新渲染（例如通过路由变化）
    rerender(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    // 仍然不应调用 navigate
    await waitFor(() => {
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  /**
   * @description 测试场景：聊天列表加载失败时不执行检查
   */
  it('当聊天列表加载失败时，应不执行重定向检查', async () => {
    // 设置 URL 参数
    mockSearchParams = new URLSearchParams('chatId=test-id');

    // 模拟加载失败
    store.dispatch(initializeChatList.rejected(new Error('Load failed'), ''));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      // 加载失败时不应调用 navigate
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });
});

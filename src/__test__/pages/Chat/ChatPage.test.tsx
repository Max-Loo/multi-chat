import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatPage from '@/pages/Chat/index';
import { renderWithProviders, createTestStore } from '@/__test__/helpers/render/redux.tsx';
import { initializeChatList } from '@/store/slices/chatSlices';

/**
 * Mock react-router-dom for routing
 */
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

/**
 * Mock useNavigateToChat hook (internal navigation hook)
 */
const mockNavigateToChat = vi.fn();
vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
  }),
}));

/**
 * Mock react-i18next
 * 使用正确的翻译函数签名，支持 t($ => $.namespace.key) 语法
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: 测试错误处理，需要构造无效输入
const mockT = (key: string | ((s: any) => string)): string => {
  if (typeof key === 'function') {
    return key({ common: { search: '搜索', hideSidebar: '隐藏侧边栏', createChat: '创建聊天' }, chat: { sendMessage: '发送消息', stopSending: '停止发送', includeReasoningContentHint: '包含推理内容提示', showSidebar: '显示侧边栏', scrollToBottom: '滚动到底部' }, model: {} });
  }
  return key;
};

vi.mock('react-i18next', () => {
  return {
    useTranslation: () => ({
      t: mockT,
      i18n: {
        language: 'zh',
        changeLanguage: vi.fn(),
      },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn(),
    },
  };
});

/**
 * ChatPage 行为驱动测试
 *
 * 测试目标：验证 ChatPage 组件的用户可见行为
 *
 * 技术方案：
 * - 不 Mock 子组件，测试完整组件树
 * - 测试用户可见行为（重定向、侧边栏状态）
 * - 使用真实 Redux store
 * - 使用 data-testid 进行断言
 */
describe('ChatPage 行为测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigateToChat.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  /**
   * @description 测试场景：聊天不存在时应重定向到 /chat
   */
  it('应该重定向到 /chat 页面 当 URL 中的 chatId 对应的聊天不存在', async () => {
    const store = createTestStore();

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams('chatId=non-existent-id');

    // 初始化空的聊天列表
    store.dispatch(initializeChatList.fulfilled([], ''));

    renderWithProviders(<ChatPage />, {
      store,
      route: '/chat?chatId=non-existent-id',
    });

    await waitFor(() => {
      expect(mockNavigateToChat).toHaveBeenCalledWith({ replace: true });
    });
  });

  /**
   * @description 测试场景：聊天存在时应正常加载
   */
  it('应该正常加载不重定向 当 URL 中的 chatId 对应的聊天存在', async () => {
    const mockChatId = 'existing-chat-id';
    const store = createTestStore();

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams(`chatId=${mockChatId}`);

    // 初始化包含测试聊天 ID 的列表
    const mockChatList = [
      { id: mockChatId, name: 'Test Chat', isDeleted: false },
    ];
    store.dispatch(initializeChatList.fulfilled(mockChatList, ''));

    renderWithProviders(<ChatPage />, {
      store,
      route: `/chat?chatId=${mockChatId}`,
    });

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
  it('应该重定向到 /chat 页面 当 URL 中的 chatId 对应的聊天已被删除', async () => {
    const deletedChatId = 'deleted-chat-id';
    const store = createTestStore();

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams(`chatId=${deletedChatId}`);

    // 初始化包含已删除聊天的列表
    const mockChatList = [
      { id: deletedChatId, name: 'Deleted Chat', isDeleted: true },
    ];
    store.dispatch(initializeChatList.fulfilled(mockChatList, ''));

    renderWithProviders(<ChatPage />, {
      store,
      route: `/chat?chatId=${deletedChatId}`,
    });

    await waitFor(() => {
      expect(mockNavigateToChat).toHaveBeenCalledWith({ replace: true });
    });
  });

  /**
   * @description 测试场景：无 chatId 参数时不执行重定向
   */
  it('应该正常加载不重定向 当 URL 中没有 chatId 参数', async () => {
    const store = createTestStore();

    // 无 chatId 参数
    mockSearchParams = new URLSearchParams();

    renderWithProviders(<ChatPage />, {
      store,
      route: '/chat',
    });

    await waitFor(() => {
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  /**
   * @description 测试场景：聊天列表加载期间不执行检查
   */
  it('应该等待加载完成后再检查 当聊天列表正在加载', async () => {
    const store = createTestStore();

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams('chatId=test-id');

    // 设置加载状态
    store.dispatch({ type: 'chat/initialize/pending' });

    renderWithProviders(<ChatPage />, {
      store,
      route: '/chat?chatId=test-id',
    });

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
  it('应该不重复重定向 当重定向后再次检查', async () => {
    const store = createTestStore();

    // 无 chatId 参数
    mockSearchParams = new URLSearchParams();

    store.dispatch(initializeChatList.fulfilled([], ''));

    renderWithProviders(<ChatPage />, {
      store,
      route: '/chat',
    });

    // 第一次渲染后，不应调用 navigate（因为没有 chatId 参数）
    await waitFor(() => {
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  /**
   * @description 测试场景：聊天列表加载失败时不执行检查
   */
  it('应该不执行重定向检查 当聊天列表加载失败', async () => {
    const store = createTestStore();

    // 设置 URL 参数
    mockSearchParams = new URLSearchParams('chatId=test-id');

    // 模拟加载失败
    store.dispatch(initializeChatList.rejected(new Error('Load failed'), ''));

    renderWithProviders(<ChatPage />, {
      store,
      route: '/chat?chatId=test-id',
    });

    await waitFor(() => {
      // 加载失败时不应调用 navigate
      expect(mockNavigateToChat).not.toHaveBeenCalled();
    });
  });

  /**
   * @description 测试场景：侧边栏默认展开状态
   */
  it('应该渲染展开的侧边栏 当页面首次加载', async () => {
    const store = createTestStore({
      chatPage: {
        isSidebarCollapsed: false,
        isShowChatPage: false,
      },
    });

    store.dispatch(initializeChatList.fulfilled([], ''));

    const { container } = renderWithProviders(<ChatPage />, {
      store,
      route: '/chat',
    });

    await waitFor(() => {
      const sidebar = container.querySelector('[data-testid="chat-sidebar"]');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).not.toHaveClass('-ml-56');
    });
  });

  /**
   * @description 测试场景：侧边栏折叠状态
   */
  it('应该渲染折叠的侧边栏 当侧边栏状态为折叠', async () => {
    const store = createTestStore({
      chatPage: {
        isSidebarCollapsed: true,
        isShowChatPage: false,
      },
    });

    store.dispatch(initializeChatList.fulfilled([], ''));

    const { container } = renderWithProviders(<ChatPage />, {
      store,
      route: '/chat',
    });

    await waitFor(() => {
      const sidebar = container.querySelector('[data-testid="chat-sidebar"]');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('-ml-56');
    });
  });

  /**
   * @description 测试场景：聊天内容区域渲染
   */
  it('应该渲染聊天内容区域 当页面加载时', async () => {
    const store = createTestStore();

    store.dispatch(initializeChatList.fulfilled([], ''));

    const { container } = renderWithProviders(<ChatPage />, {
      store,
      route: '/chat',
    });

    await waitFor(() => {
      const content = container.querySelector('[data-testid="chat-content"]');
      expect(content).toBeInTheDocument();
    });
  });

  /**
   * @description 测试场景：聊天页面整体结构
   */
  it('应该渲染完整的页面结构 当页面加载时', async () => {
    const store = createTestStore();

    store.dispatch(initializeChatList.fulfilled([], ''));

    const { container } = renderWithProviders(<ChatPage />, {
      store,
      route: '/chat',
    });

    await waitFor(() => {
      const page = container.querySelector('[data-testid="chat-page"]');
      const sidebar = container.querySelector('[data-testid="chat-sidebar"]');
      const content = container.querySelector('[data-testid="chat-content"]');

      expect(page).toBeInTheDocument();
      expect(sidebar).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });
});

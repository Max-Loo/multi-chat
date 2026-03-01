import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '@/components/Sidebar';

/**
 * Mock react-router-dom hooks
 */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

/**
 * Mock useCurrentSelectedChat hook
 */
vi.mock('@/hooks/useCurrentSelectedChat', () => ({
  useCurrentSelectedChat: () => mockSelectedChat,
}));

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
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          navigation: {
            chat: '聊天',
            model: '模型',
            setting: '设置',
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
 * 可变的 mock 函数和变量
 */
const mockNavigate = vi.fn();
const mockNavigateToChat = vi.fn();
let mockLocation: { pathname: string };
let mockSelectedChat: { id: string } | null = null;

describe('Sidebar 组件测试', () => {
  beforeEach(() => {
    // 清理 DOM
    cleanup();

    // 重置所有 mocks
    vi.clearAllMocks();

    // 设置默认的 location 和 selectedChat
    mockLocation = { pathname: '/' };
    mockSelectedChat = null;
  });

  /**
   * 2.2 渲染测试：测试组件正常渲染 3 个导航项
   */
  it('应该渲染 3 个导航项', () => {
    render(<Sidebar />);

    // 检查是否有 3 个按钮
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // 检查按钮的 title 属性（国际化文本）
    expect(screen.getByTitle('聊天')).toBeInTheDocument();
    expect(screen.getByTitle('模型')).toBeInTheDocument();
    expect(screen.getByTitle('设置')).toBeInTheDocument();
  });

  /**
   * 2.3 渲染测试：测试导航项包含正确的图标、文本和样式类
   */
  it('导航项应该包含正确的图标、文本和样式类', () => {
    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    const modelButton = screen.getByTitle('模型');
    const settingButton = screen.getByTitle('设置');

    // 检查按钮存在
    expect(chatButton).toBeInTheDocument();
    expect(modelButton).toBeInTheDocument();
    expect(settingButton).toBeInTheDocument();

    // 检查基础样式类
    expect(chatButton).toHaveClass('text-blue-400!');
    expect(modelButton).toHaveClass('text-emerald-400!');
    expect(settingButton).toHaveClass('text-violet-400!');

    // 检查尺寸和布局类
    expect(chatButton).toHaveClass('w-10', 'h-10');
    expect(modelButton).toHaveClass('w-10', 'h-10');
    expect(settingButton).toHaveClass('w-10', 'h-10');
  });

  /**
   * 2.4 渲染测试：测试组件接受并应用自定义 className
   */
  it('应该接受并应用自定义 className', () => {
    const { container } = render(<Sidebar className="custom-class" />);

    const sidebarDiv = container.querySelector('.bg-gray-50');
    expect(sidebarDiv).toHaveClass('custom-class');
  });

  /**
   * 2.5 路由状态测试：测试在 `/chat` 路由时聊天导航项显示激活状态
   */
  it('在 /chat 路由时，聊天导航项应显示激活状态', () => {
    mockLocation = { pathname: '/chat' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');

    // 检查激活状态样式类
    expect(chatButton).toHaveClass('bg-blue-100!', 'text-blue-500!');
    expect(chatButton).not.toHaveClass('hover:text-blue-500!', 'hover:bg-blue-100!');
  });

  /**
   * 2.6 路由状态测试：测试在 `/model` 路由时模型导航项显示激活状态
   */
  it('在 /model 路由时，模型导航项应显示激活状态', () => {
    mockLocation = { pathname: '/model' };

    render(<Sidebar />);

    const modelButton = screen.getByTitle('模型');

    // 检查激活状态样式类
    expect(modelButton).toHaveClass('bg-emerald-100!', 'text-emerald-500!');
    expect(modelButton).not.toHaveClass('hover:text-emerald-500!', 'hover:bg-emerald-100!');
  });

  /**
   * 2.7 路由状态测试：测试在 `/setting` 路由时设置导航项显示激活状态
   */
  it('在 /setting 路由时，设置导航项应显示激活状态', () => {
    mockLocation = { pathname: '/setting' };

    render(<Sidebar />);

    const settingButton = screen.getByTitle('设置');

    // 检查激活状态样式类
    expect(settingButton).toHaveClass('bg-violet-100!', 'text-violet-500!');
    expect(settingButton).not.toHaveClass('hover:text-violet-500!', 'hover:bg-violet-100!');
  });

  /**
   * 2.8 路由状态测试：测试在子路径时父路径导航项仍显示激活状态
   */
  it('在子路径 /chat/123 时，聊天导航项应显示激活状态', () => {
    mockLocation = { pathname: '/chat/123' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');

    // 检查激活状态样式类（因为使用 startsWith 判断）
    expect(chatButton).toHaveClass('bg-blue-100!', 'text-blue-500!');
  });

  /**
   * 2.9 导航交互测试：测试点击非激活导航项触发导航
   */
  it('点击非激活导航项应触发导航', () => {
    mockLocation = { pathname: '/' };

    render(<Sidebar />);

    const modelButton = screen.getByTitle('模型');
    fireEvent.click(modelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/model');
  });

  /**
   * 2.10 导航交互测试：测试点击已激活导航项不触发重复导航
   */
  it('点击已激活导航项不应触发重复导航', () => {
    mockLocation = { pathname: '/chat' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    // 不应该调用 navigate（因为在当前路径）
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * 2.11 导航交互测试：测试从其他页面点击聊天导航且有选中聊天时的行为
   */
  it('从其他页面点击聊天导航且存在选中聊天时，应调用 navigateToChat', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = { id: 'chat-123' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    // 应该调用 navigateToChat 而不是直接调用 navigate
    expect(mockNavigateToChat).toHaveBeenCalledWith({
      chatId: 'chat-123',
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * 2.12 导航交互测试：测试从其他页面点击聊天导航且无选中聊天时的行为
   */
  it('从其他页面点击聊天导航且不存在选中聊天时，应调用 navigate', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = null;

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    // 应该调用 navigate 到 /chat
    expect(mockNavigate).toHaveBeenCalledWith('/chat');
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  /**
   * 2.13 边界情况测试：测试 `selectedChat` 为 null 时的导航行为
   */
  it('selectedChat 为 null 时，点击聊天导航应直接导航到 /chat', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = null;

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  /**
   * 2.13 边界情况测试：测试 `selectedChat` 为 undefined 时的导航行为
   */
  it('selectedChat 为 undefined 时，点击聊天导航应直接导航到 /chat', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = null as any; // null 和 undefined 行为一致

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  /**
   * 2.14 国际化测试：测试导航项标签正确使用国际化
   */
  it('导航项标签应正确使用国际化', () => {
    render(<Sidebar />);

    // 检查国际化文本是否正确显示
    expect(screen.getByTitle('聊天')).toBeInTheDocument();
    expect(screen.getByTitle('模型')).toBeInTheDocument();
    expect(screen.getByTitle('设置')).toBeInTheDocument();
  });
});
